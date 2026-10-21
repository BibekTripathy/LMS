"""Retake limit (Quiz.max_attempts) and leaderboard visibility (Quiz.leaderboard_enabled)."""
from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from users.models import User
from courses.models import Course, Module, Lesson
from enrollments.models import Enrollment
from assessments.models import Quiz, Question, QuestionOption, QuizAttempt


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def instructor():
    return User.objects.create_user(email='inst@example.com', password='pw12345678', role='INSTRUCTOR')


@pytest.fixture
def student():
    return User.objects.create_user(
        email='stu@example.com', password='pw12345678', role='STUDENT', first_name='Stu', last_name='Dent'
    )


@pytest.fixture
def classmate():
    # No name on purpose: the leaderboard must not fall back to the email for other students.
    return User.objects.create_user(email='mate@example.com', password='pw12345678', role='STUDENT')


@pytest.fixture
def course(instructor, student, classmate):
    course = Course.objects.create(title='Course', instructor=instructor, is_published=True, status='PUBLISHED')
    module = Module.objects.create(course=course, title='M1', order=1)
    Lesson.objects.create(module=module, title='L1', order=1)
    Enrollment.objects.create(student=student, course=course, status='ACTIVE')
    Enrollment.objects.create(student=classmate, course=course, status='ACTIVE')
    return course


@pytest.fixture
def quiz(course):
    quiz = Quiz.objects.create(course=course, title='Quiz', status='PUBLISHED', time_limit_seconds=600)
    question = Question.objects.create(quiz=quiz, prompt='2 + 2?', marks=1, position=1)
    QuestionOption.objects.create(question=question, text='4', is_correct=True, position=1)
    QuestionOption.objects.create(question=question, text='5', is_correct=False, position=2)
    return quiz


def start(client, quiz):
    return client.post(f'/api/v1/quizzes/{quiz.id}/start/')


def start_and_submit(client, quiz):
    response = start(client, quiz)
    assert response.status_code == status.HTTP_201_CREATED, response.data
    submitted = client.post(f"/api/v1/attempts/{response.data['id']}/submit/", {}, format='json')
    assert submitted.status_code == status.HTTP_200_OK, submitted.data


@pytest.mark.django_db
class TestRetakeLimit:
    def test_unlimited_by_default(self, api_client, student, quiz):
        api_client.force_authenticate(student)
        for _ in range(3):
            start_and_submit(api_client, quiz)
        assert api_client.get(f'/api/v1/quizzes/{quiz.id}/').data['attempts_remaining'] is None

    def test_limit_blocks_new_attempt(self, api_client, student, quiz):
        quiz.max_attempts = 2
        quiz.save()
        api_client.force_authenticate(student)

        start_and_submit(api_client, quiz)
        assert api_client.get(f'/api/v1/quizzes/{quiz.id}/').data['attempts_remaining'] == 1
        start_and_submit(api_client, quiz)

        response = start(api_client, quiz)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['code'] == 'MAX_ATTEMPTS_REACHED'
        assert QuizAttempt.objects.filter(quiz=quiz, student=student).count() == 2

        results = api_client.get(f'/api/v1/quizzes/{quiz.id}/results/me/').data
        assert results['max_attempts'] == 2
        assert results['attempts_remaining'] == 0

    def test_in_progress_attempt_can_be_resumed_at_the_limit(self, api_client, student, quiz):
        quiz.max_attempts = 1
        quiz.save()
        api_client.force_authenticate(student)

        first = start(api_client, quiz)
        assert first.status_code == status.HTTP_201_CREATED
        resumed = start(api_client, quiz)
        assert resumed.status_code == status.HTTP_200_OK
        assert resumed.data['id'] == first.data['id']

    def test_expired_attempts_count_towards_the_limit(self, api_client, student, quiz):
        quiz.max_attempts = 1
        quiz.save()
        now = timezone.now()
        QuizAttempt.objects.create(
            quiz=quiz, student=student, status='IN_PROGRESS',
            started_at=now - timedelta(hours=1), deadline_at=now - timedelta(minutes=30),
        )
        api_client.force_authenticate(student)

        response = start(api_client, quiz)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['code'] == 'MAX_ATTEMPTS_REACHED'
        assert QuizAttempt.objects.get(quiz=quiz, student=student).status == 'EXPIRED'

    def test_instructor_is_not_limited(self, api_client, instructor, quiz):
        quiz.max_attempts = 1
        quiz.save()
        api_client.force_authenticate(instructor)
        start_and_submit(api_client, quiz)
        start_and_submit(api_client, quiz)

    def test_instructor_sets_and_clears_the_limit(self, api_client, instructor, quiz):
        api_client.force_authenticate(instructor)
        url = f'/api/v1/quizzes/{quiz.id}/manage/'

        assert api_client.patch(url, {'max_attempts': 0}, format='json').status_code == status.HTTP_400_BAD_REQUEST

        response = api_client.patch(url, {'max_attempts': 3, 'leaderboard_enabled': False}, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['max_attempts'] == 3
        assert response.data['leaderboard_enabled'] is False

        response = api_client.patch(url, {'max_attempts': None}, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['max_attempts'] is None


@pytest.mark.django_db
class TestLeaderboardPrivacy:
    def _submit_for(self, client, user, quiz):
        client.force_authenticate(user)
        start_and_submit(client, quiz)

    def test_students_never_see_emails(self, api_client, student, classmate, quiz):
        self._submit_for(api_client, student, quiz)
        self._submit_for(api_client, classmate, quiz)

        api_client.force_authenticate(student)
        response = api_client.get(f'/api/v1/quizzes/{quiz.id}/leaderboard/')
        assert response.status_code == status.HTTP_200_OK
        entries = response.data['leaderboard']
        assert len(entries) == 2
        assert all(entry['student_email'] is None for entry in entries)
        assert 'mate@example.com' not in str(response.data)
        assert {entry['student_name'] for entry in entries} == {'Stu Dent', 'Learner'}

    def test_instructor_sees_emails(self, api_client, instructor, student, quiz):
        self._submit_for(api_client, student, quiz)
        api_client.force_authenticate(instructor)
        response = api_client.get(f'/api/v1/quizzes/{quiz.id}/leaderboard/')
        assert response.data['leaderboard'][0]['student_email'] == 'stu@example.com'

    def test_disabled_leaderboard_is_hidden_from_students(self, api_client, instructor, student, quiz):
        quiz.leaderboard_enabled = False
        quiz.save()

        api_client.force_authenticate(student)
        response = api_client.get(f'/api/v1/quizzes/{quiz.id}/leaderboard/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data['code'] == 'LEADERBOARD_DISABLED'

        api_client.force_authenticate(instructor)
        assert api_client.get(f'/api/v1/quizzes/{quiz.id}/leaderboard/').status_code == status.HTTP_200_OK
