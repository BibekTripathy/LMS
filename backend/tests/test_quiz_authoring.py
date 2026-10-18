"""Tests for the instructor quiz-authoring endpoints (courses/{id}/quizzes, quizzes/{id}/manage, questions)."""
import json
from decimal import Decimal

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from assessments.models import Answer, Question, QuestionOption, Quiz, QuizAttempt
from courses.models import Course, Lesson, Module
from enrollments.models import Enrollment
from users.models import User


def options(correct=0, n=4):
    return [{'text': f'Option {i}', 'is_correct': i == correct} for i in range(n)]


@pytest.fixture
def setup():
    owner = User.objects.create_user(email='owner@example.com', password='pw', role='INSTRUCTOR')
    other = User.objects.create_user(email='other@example.com', password='pw', role='INSTRUCTOR')
    student = User.objects.create_user(email='student@example.com', password='pw', role='STUDENT')
    outsider = User.objects.create_user(email='outsider@example.com', password='pw', role='STUDENT')
    admin = User.objects.create_user(email='admin@example.com', password='pw', role='ADMIN', is_staff=True)
    course = Course.objects.create(title='Databases', instructor=owner, status='PUBLISHED')
    other_course = Course.objects.create(title='Other', instructor=other, status='PUBLISHED')
    lesson = Lesson.objects.create(module=Module.objects.create(course=course, title='M', order=1), title='L', order=1)
    other_lesson = Lesson.objects.create(module=Module.objects.create(course=other_course, title='M', order=1), title='L', order=1)
    Enrollment.objects.create(student=student, course=course, status='ACTIVE')

    quiz = Quiz.objects.create(course=course, title='Published quiz', status='PUBLISHED')
    q = Question.objects.create(quiz=quiz, prompt='What is SQL?', marks=1, explanation='Because.', position=1)
    QuestionOption.objects.create(question=q, text='Query language', is_correct=True, position=1)
    QuestionOption.objects.create(question=q, text='Snake', is_correct=False, position=2)
    draft = Quiz.objects.create(course=course, title='Draft quiz', status='DRAFT')
    return dict(owner=owner, other=other, student=student, outsider=outsider, admin=admin, course=course,
                other_course=other_course, lesson=lesson, other_lesson=other_lesson, quiz=quiz, question=q, draft=draft)


def as_user(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def dumps(data):
    return json.dumps(data, default=str)


@pytest.mark.django_db
class TestCourseQuizList:
    def test_owner_sees_all_quizzes_with_answers(self, setup):
        res = as_user(setup['owner']).get(f"/api/v1/courses/{setup['course'].id}/quizzes/")
        assert res.status_code == 200
        assert {q['title'] for q in res.data} == {'Published quiz', 'Draft quiz'}
        assert 'is_correct' in dumps(res.data)

    def test_other_instructor_cannot_see_answers(self, setup):
        res = as_user(setup['other']).get(f"/api/v1/courses/{setup['course'].id}/quizzes/")
        assert res.status_code == 403
        assert 'is_correct' not in dumps(res.data)

    def test_enrolled_student_sees_published_without_answers(self, setup):
        res = as_user(setup['student']).get(f"/api/v1/courses/{setup['course'].id}/quizzes/")
        assert res.status_code == 200
        assert [q['title'] for q in res.data] == ['Published quiz']
        assert 'is_correct' not in dumps(res.data) and 'explanation' not in dumps(res.data)

    def test_unenrolled_student_is_rejected(self, setup):
        assert as_user(setup['outsider']).get(f"/api/v1/courses/{setup['course'].id}/quizzes/").status_code == 403

    def test_admin_sees_everything(self, setup):
        assert len(as_user(setup['admin']).get(f"/api/v1/courses/{setup['course'].id}/quizzes/").data) == 2


@pytest.mark.django_db
class TestQuizCrud:
    def test_owner_creates_draft_quiz(self, setup):
        res = as_user(setup['owner']).post(f"/api/v1/courses/{setup['course'].id}/quizzes/",
                                           {'title': 'New', 'lesson': str(setup['lesson'].id)}, format='json')
        assert res.status_code == 201
        assert res.data['status'] == 'DRAFT' and str(res.data['course']) == str(setup['course'].id)

    def test_non_owner_cannot_create(self, setup):
        url = f"/api/v1/courses/{setup['course'].id}/quizzes/"
        assert as_user(setup['other']).post(url, {'title': 'X'}, format='json').status_code == 403
        assert as_user(setup['student']).post(url, {'title': 'X'}, format='json').status_code == 403

    def test_lesson_must_belong_to_course(self, setup):
        res = as_user(setup['owner']).post(f"/api/v1/courses/{setup['course'].id}/quizzes/",
                                           {'title': 'X', 'lesson': str(setup['other_lesson'].id)}, format='json')
        assert res.status_code == 400 and 'lesson' in res.data

    def test_pass_percentage_capped(self, setup):
        res = as_user(setup['owner']).post(f"/api/v1/courses/{setup['course'].id}/quizzes/",
                                           {'title': 'X', 'pass_percentage': 150}, format='json')
        assert res.status_code == 400

    def test_course_cannot_be_changed_on_patch(self, setup):
        res = as_user(setup['owner']).patch(f"/api/v1/quizzes/{setup['quiz'].id}/manage/",
                                            {'course': str(setup['other_course'].id), 'title': 'Renamed'}, format='json')
        assert res.status_code == 200
        setup['quiz'].refresh_from_db()
        assert setup['quiz'].course == setup['course'] and setup['quiz'].title == 'Renamed'

    def test_non_owner_cannot_manage(self, setup):
        url = f"/api/v1/quizzes/{setup['quiz'].id}/manage/"
        for user in (setup['other'], setup['student']):
            client = as_user(user)
            assert client.get(url).status_code == 403
            assert client.patch(url, {'title': 'Hacked'}, format='json').status_code == 403
            assert client.delete(url).status_code == 403

    def test_quiz_with_attempts_cannot_be_deleted(self, setup):
        QuizAttempt.objects.create(quiz=setup['quiz'], student=setup['student'])
        res = as_user(setup['owner']).delete(f"/api/v1/quizzes/{setup['quiz'].id}/manage/")
        assert res.status_code == 400 and res.data['code'] == 'HAS_ATTEMPTS'
        assert as_user(setup['owner']).delete(f"/api/v1/quizzes/{setup['draft'].id}/manage/").status_code == 204


@pytest.mark.django_db
class TestQuestionAuthoring:
    def test_create_question_with_valid_options(self, setup):
        res = as_user(setup['owner']).post(f"/api/v1/quizzes/{setup['draft'].id}/questions/",
                                           {'prompt': 'Pick one', 'options': options(correct=2)}, format='json')
        assert res.status_code == 201
        assert [o['is_correct'] for o in res.data['options']] == [False, False, True, False]
        assert [o['position'] for o in res.data['options']] == [1, 2, 3, 4]

    @pytest.mark.parametrize('opts, message', [
        ([{'text': 'Only', 'is_correct': True}], 'between 2 and 6'),
        (options(n=7), 'between 2 and 6'),
        ([{'text': 'A', 'is_correct': False}, {'text': 'B', 'is_correct': False}], 'Exactly one'),
        ([{'text': 'A', 'is_correct': True}, {'text': 'B', 'is_correct': True}], 'Exactly one'),
        ([{'text': 'Same', 'is_correct': True}, {'text': 'same', 'is_correct': False}], 'unique'),
        ([{'text': '', 'is_correct': True}, {'text': 'B', 'is_correct': False}], 'blank'),
    ])
    def test_invalid_options_rejected(self, setup, opts, message):
        res = as_user(setup['owner']).post(f"/api/v1/quizzes/{setup['draft'].id}/questions/",
                                           {'prompt': 'Pick one', 'options': opts}, format='json')
        assert res.status_code == 400 and message in dumps(res.data)

    def test_prompt_and_options_required(self, setup):
        url = f"/api/v1/quizzes/{setup['draft'].id}/questions/"
        assert as_user(setup['owner']).post(url, {'options': options()}, format='json').status_code == 400
        assert as_user(setup['owner']).post(url, {'prompt': 'No options'}, format='json').status_code == 400

    def test_position_after_delete_does_not_collide(self, setup):
        client = as_user(setup['owner'])
        url = f"/api/v1/quizzes/{setup['draft'].id}/questions/"
        first = client.post(url, {'prompt': 'One', 'options': options()}, format='json').data
        client.post(url, {'prompt': 'Two', 'options': options()}, format='json')
        assert client.delete(f"/api/v1/questions/{first['id']}/").status_code == 204
        res = client.post(url, {'prompt': 'Three', 'options': options()}, format='json')
        assert res.status_code == 201 and res.data['position'] == 3

    def test_explicit_duplicate_position_rejected(self, setup):
        res = as_user(setup['owner']).post(f"/api/v1/quizzes/{setup['quiz'].id}/questions/",
                                           {'prompt': 'Clash', 'position': 1, 'options': options()}, format='json')
        assert res.status_code == 400 and 'position' in res.data

    def test_options_updated_in_place(self, setup):
        q = setup['question']
        keep = q.options.get(position=1)
        res = as_user(setup['owner']).patch(f'/api/v1/questions/{q.id}/', {'options': [
            {'id': str(keep.id), 'text': 'Structured Query Language', 'is_correct': True},
            {'text': 'A database', 'is_correct': False},
            {'text': 'A snake', 'is_correct': False},
        ]}, format='json')
        assert res.status_code == 200, res.data
        keep.refresh_from_db()
        assert keep.text == 'Structured Query Language' and keep.position == 1
        assert q.options.count() == 3

    def test_answered_question_options_and_deletion_are_frozen(self, setup):
        q = setup['question']
        attempt = QuizAttempt.objects.create(quiz=setup['quiz'], student=setup['student'], status='SUBMITTED',
                                             submitted_at=timezone.now())
        chosen = q.options.get(is_correct=True)
        Answer.objects.create(attempt=attempt, question=q, selected_option=chosen, is_correct=True, marks_awarded=Decimal(1))

        client = as_user(setup['owner'])
        res = client.patch(f'/api/v1/questions/{q.id}/', {'options': options()}, format='json')
        assert res.status_code == 400
        assert client.delete(f'/api/v1/questions/{q.id}/').data['code'] == 'HAS_ANSWERS'
        # Typos in the prompt can still be fixed; history is untouched.
        assert client.patch(f'/api/v1/questions/{q.id}/', {'prompt': 'What is SQL? (fixed)'}, format='json').status_code == 200
        assert Answer.objects.get(attempt=attempt).selected_option == chosen

    def test_non_owner_cannot_author_questions(self, setup):
        for user in (setup['other'], setup['student']):
            client = as_user(user)
            assert client.post(f"/api/v1/quizzes/{setup['quiz'].id}/questions/",
                               {'prompt': 'X', 'options': options()}, format='json').status_code == 403
            assert client.patch(f"/api/v1/questions/{setup['question'].id}/", {'prompt': 'X'}, format='json').status_code == 403
            assert client.delete(f"/api/v1/questions/{setup['question'].id}/").status_code == 403
