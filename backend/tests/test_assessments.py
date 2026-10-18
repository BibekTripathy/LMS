import uuid
from decimal import Decimal
from datetime import timedelta
import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from users.models import User
from courses.models import Course, Module, Lesson
from enrollments.models import Enrollment
from assessments.models import Quiz, Question, QuestionOption, QuizAttempt, Answer


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def instructor():
    return User.objects.create_user(
        email="instructor_quiz@example.com",
        password="password123",
        role="INSTRUCTOR"
    )


@pytest.fixture
def student1():
    return User.objects.create_user(
        email="student1_quiz@example.com",
        password="password123",
        role="STUDENT"
    )


@pytest.fixture
def student2():
    return User.objects.create_user(
        email="student2_quiz@example.com",
        password="password123",
        role="STUDENT"
    )


@pytest.fixture
def course(instructor):
    return Course.objects.create(
        title="Database Systems",
        description="Relational database design",
        instructor=instructor,
        is_published=True,
        status="PUBLISHED"
    )


@pytest.fixture
def enrollment1(student1, course):
    return Enrollment.objects.create(
        student=student1,
        course=course,
        status='ACTIVE'
    )


@pytest.fixture
def quiz(course):
    q = Quiz.objects.create(
        course=course,
        title="SQL Fundamentals Quiz",
        description="Test your SQL knowledge",
        time_limit_seconds=1200, # 20 minutes
        pass_percentage=70,
        status="PUBLISHED"
    )

    # Question 1 (2 marks)
    q1 = Question.objects.create(
        quiz=q,
        prompt="Which command is used to retrieve data in SQL?",
        question_type="MCQ",
        marks=2,
        explanation="SELECT command is used to query data.",
        position=1
    )
    QuestionOption.objects.create(question=q1, text="SELECT", is_correct=True, position=1)
    QuestionOption.objects.create(question=q1, text="UPDATE", is_correct=False, position=2)
    QuestionOption.objects.create(question=q1, text="INSERT", is_correct=False, position=3)
    QuestionOption.objects.create(question=q1, text="DELETE", is_correct=False, position=4)

    # Question 2 (3 marks)
    q2 = Question.objects.create(
        quiz=q,
        prompt="Which keyword is used to eliminate duplicate rows?",
        question_type="MCQ",
        marks=3,
        explanation="DISTINCT removes duplicate rows from the query output.",
        position=2
    )
    QuestionOption.objects.create(question=q2, text="UNIQUE", is_correct=False, position=1)
    QuestionOption.objects.create(question=q2, text="DISTINCT", is_correct=True, position=2)
    QuestionOption.objects.create(question=q2, text="FILTER", is_correct=False, position=3)
    QuestionOption.objects.create(question=q2, text="GROUP", is_correct=False, position=4)

    return q


@pytest.mark.django_db
class TestQuizAccessControl:

    def test_unauthenticated_requests_are_rejected(self, api_client, quiz):
        # GET quiz
        res = api_client.get(f'/api/v1/quizzes/{quiz.id}/')
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

        # POST start
        res = api_client.post(f'/api/v1/quizzes/{quiz.id}/start/')
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

        # GET results
        res = api_client.get(f'/api/v1/quizzes/{quiz.id}/results/me/')
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

    def test_non_enrolled_student_cannot_access_or_start_quiz(self, api_client, student2, quiz):
        api_client.force_authenticate(user=student2)

        # GET quiz details
        res = api_client.get(f'/api/v1/quizzes/{quiz.id}/')
        assert res.status_code == status.HTTP_403_FORBIDDEN

        # POST start attempt
        res = api_client.post(f'/api/v1/quizzes/{quiz.id}/start/')
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_student_cannot_modify_another_students_attempt(self, api_client, student1, student2, enrollment1, quiz):
        # student1 starts attempt
        api_client.force_authenticate(user=student1)
        start_res = api_client.post(f'/api/v1/quizzes/{quiz.id}/start/')
        attempt_id = start_res.data['id']

        # student2 tries to put answers into student1's attempt
        api_client.force_authenticate(user=student2)
        res = api_client.put(f'/api/v1/attempts/{attempt_id}/answers/', {'answers': []}, format='json')
        assert res.status_code == status.HTTP_403_FORBIDDEN

        # student2 tries to submit student1's attempt
        res = api_client.post(f'/api/v1/attempts/{attempt_id}/submit/')
        assert res.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestAnswerSecurity:

    def test_correct_answers_and_explanations_are_not_exposed_before_submission(self, api_client, student1, enrollment1, quiz):
        api_client.force_authenticate(user=student1)

        # 1. GET /quizzes/{id}/
        res = api_client.get(f'/api/v1/quizzes/{quiz.id}/')
        assert res.status_code == status.HTTP_200_OK
        questions = res.data['questions']
        assert len(questions) == 2

        for q in questions:
            # Explanations should not be present
            assert 'explanation' not in q or q.get('explanation') == ''
            for opt in q['options']:
                # is_correct must NOT be in options
                assert 'is_correct' not in opt

        # 2. GET /attempts/{id}/ while in-progress
        start_res = api_client.post(f'/api/v1/quizzes/{quiz.id}/start/')
        attempt_id = start_res.data['id']

        attempt_res = api_client.get(f'/api/v1/attempts/{attempt_id}/')
        assert attempt_res.status_code == status.HTTP_200_OK
        for q in attempt_res.data['questions']:
            assert 'explanation' not in q or q.get('explanation') == ''
            for opt in q['options']:
                assert 'is_correct' not in opt


@pytest.mark.django_db
class TestQuizAttemptAndGradingFlow:

    def test_full_quiz_lifecycle_and_grading(self, api_client, student1, enrollment1, quiz):
        api_client.force_authenticate(user=student1)

        # 1. Start Attempt
        start_res = api_client.post(f'/api/v1/quizzes/{quiz.id}/start/')
        assert start_res.status_code == status.HTTP_201_CREATED
        attempt_id = start_res.data['id']
        assert start_res.data['status'] == 'IN_PROGRESS'
        assert start_res.data['deadline_at'] is not None

        # Fetch questions to get valid option IDs
        quiz_res = api_client.get(f'/api/v1/quizzes/{quiz.id}/')
        q1 = quiz_res.data['questions'][0]
        q2 = quiz_res.data['questions'][1]

        # In q1: SELECT is correct option
        # In q2: DISTINCT is correct option
        q1_obj = Question.objects.get(id=q1['id'])
        q1_correct_opt = q1_obj.options.get(is_correct=True)
        q2_obj = Question.objects.get(id=q2['id'])
        q2_incorrect_opt = q2_obj.options.filter(is_correct=False).first()

        # 2. Save answers: Answer Q1 correctly, Q2 incorrectly
        save_res = api_client.put(
            f'/api/v1/attempts/{attempt_id}/answers/',
            {
                'answers': [
                    {'question_id': str(q1['id']), 'selected_option_id': str(q1_correct_opt.id)},
                    {'question_id': str(q2['id']), 'selected_option_id': str(q2_incorrect_opt.id)}
                ]
            },
            format='json'
        )
        assert save_res.status_code == status.HTTP_200_OK
        assert save_res.data['saved_count'] == 2

        # Verify answers saved in database
        assert Answer.objects.filter(attempt_id=attempt_id).count() == 2

        # 3. Submit attempt
        submit_res = api_client.post(f'/api/v1/attempts/{attempt_id}/submit/')
        assert submit_res.status_code == status.HTTP_200_OK
        assert submit_res.data['status'] == 'SUBMITTED'
        # Total possible: 2 + 3 = 5 marks
        # Marks obtained: Q1 (2 marks) + Q2 (0 marks) = 2 marks
        # Percentage: 2 / 5 * 100 = 40.0%
        # Pass threshold is 70% -> passed should be False
        assert Decimal(str(submit_res.data['marks_obtained'])) == Decimal('2.00')
        assert submit_res.data['total_marks_possible'] == 5
        assert Decimal(str(submit_res.data['percentage'])) == Decimal('40.00')
        assert submit_res.data['passed'] is False

        # Post-submission: review answers and explanations are now revealed
        submitted_questions = submit_res.data['questions']
        assert submitted_questions[0]['explanation'] == "SELECT command is used to query data."
        assert any(opt['is_correct'] for opt in submitted_questions[0]['options'])

        # 4. Results history endpoint
        results_res = api_client.get(f'/api/v1/quizzes/{quiz.id}/results/me/')
        assert results_res.status_code == status.HTTP_200_OK
        assert results_res.data['total_attempts'] == 1
        assert Decimal(str(results_res.data['best_score'])) == Decimal('2.00')
        assert results_res.data['has_passed'] is False

    def test_passing_score_calculation(self, api_client, student1, enrollment1, quiz):
        api_client.force_authenticate(user=student1)

        # Start attempt
        start_res = api_client.post(f'/api/v1/quizzes/{quiz.id}/start/')
        attempt_id = start_res.data['id']

        q1_obj = quiz.questions.all()[0]
        q2_obj = quiz.questions.all()[1]
        q1_correct_opt = q1_obj.options.get(is_correct=True)
        q2_correct_opt = q2_obj.options.get(is_correct=True)

        # Submit directly with 100% correct answers
        submit_res = api_client.post(
            f'/api/v1/attempts/{attempt_id}/submit/',
            {
                'answers': [
                    {'question_id': str(q1_obj.id), 'selected_option_id': str(q1_correct_opt.id)},
                    {'question_id': str(q2_obj.id), 'selected_option_id': str(q2_correct_opt.id)}
                ]
            },
            format='json'
        )
        assert submit_res.status_code == status.HTTP_200_OK
        assert Decimal(str(submit_res.data['marks_obtained'])) == Decimal('5.00')
        assert Decimal(str(submit_res.data['percentage'])) == Decimal('100.00')
        assert submit_res.data['passed'] is True


@pytest.mark.django_db
class TestDeadlinesAndDuplicateSubmissions:

    def test_duplicate_submission_is_rejected(self, api_client, student1, enrollment1, quiz):
        api_client.force_authenticate(user=student1)
        start_res = api_client.post(f'/api/v1/quizzes/{quiz.id}/start/')
        attempt_id = start_res.data['id']

        # First submit
        first_res = api_client.post(f'/api/v1/attempts/{attempt_id}/submit/')
        assert first_res.status_code == status.HTTP_200_OK
        assert first_res.data['status'] == 'SUBMITTED'

        # Duplicate submit attempt
        dup_res = api_client.post(f'/api/v1/attempts/{attempt_id}/submit/')
        assert dup_res.status_code == status.HTTP_400_BAD_REQUEST

    def test_expired_attempt_is_rejected_on_saving_answers(self, api_client, student1, enrollment1, quiz):
        api_client.force_authenticate(user=student1)
        # Create an attempt with deadline in the past
        past_deadline = timezone.now() - timedelta(minutes=5)
        attempt = QuizAttempt.objects.create(
            quiz=quiz,
            student=student1,
            status='IN_PROGRESS',
            started_at=past_deadline - timedelta(minutes=20),
            deadline_at=past_deadline
        )

        res = api_client.put(f'/api/v1/attempts/{attempt.id}/answers/', {'answers': []}, format='json')
        assert res.status_code == status.HTTP_400_BAD_REQUEST

        attempt.refresh_from_db()
        assert attempt.status == 'EXPIRED'

    def test_expired_attempt_is_rejected_on_submit(self, api_client, student1, enrollment1, quiz):
        api_client.force_authenticate(user=student1)
        past_deadline = timezone.now() - timedelta(minutes=1)
        attempt = QuizAttempt.objects.create(
            quiz=quiz,
            student=student1,
            status='IN_PROGRESS',
            started_at=past_deadline - timedelta(minutes=20),
            deadline_at=past_deadline
        )

        res = api_client.post(f'/api/v1/attempts/{attempt.id}/submit/')
        assert res.status_code == status.HTTP_400_BAD_REQUEST

        attempt.refresh_from_db()
        assert attempt.status == 'EXPIRED'


@pytest.mark.django_db
class TestInvalidQuestionOptionValidation:

    def test_option_from_another_question_is_rejected(self, api_client, student1, enrollment1, quiz):
        api_client.force_authenticate(user=student1)
        start_res = api_client.post(f'/api/v1/quizzes/{quiz.id}/start/')
        attempt_id = start_res.data['id']

        q1 = quiz.questions.all()[0]
        q2 = quiz.questions.all()[1]
        q2_opt = q2.options.first()

        # Submit Q1 with an option that belongs to Q2
        res = api_client.put(
            f'/api/v1/attempts/{attempt_id}/answers/',
            {
                'answers': [
                    {'question_id': str(q1.id), 'selected_option_id': str(q2_opt.id)}
                ]
            },
            format='json'
        )
        assert res.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestReviewRegressions:
    """Regression tests for issues found in review of PR #6."""

    def _expire(self, attempt):
        attempt.deadline_at = timezone.now() - timedelta(seconds=1)
        attempt.save(update_fields=['deadline_at'])

    def test_expired_attempt_does_not_reveal_answers(self, api_client, student1, enrollment1, quiz):
        api_client.force_authenticate(user=student1)
        attempt_id = api_client.post(f'/api/v1/quizzes/{quiz.id}/start/').data['id']
        self._expire(QuizAttempt.objects.get(id=attempt_id))
        api_client.put(f'/api/v1/attempts/{attempt_id}/answers/', {'answers': []}, format='json')
        assert QuizAttempt.objects.get(id=attempt_id).status == 'EXPIRED'

        res = api_client.get(f'/api/v1/attempts/{attempt_id}/')
        assert res.status_code == status.HTTP_200_OK
        for question in res.data['questions']:
            assert 'explanation' not in question
            for option in question['options']:
                assert 'is_correct' not in option

    def test_unsubmitted_answers_hide_grading_fields(self, api_client, student1, enrollment1, quiz):
        api_client.force_authenticate(user=student1)
        attempt_id = api_client.post(f'/api/v1/quizzes/{quiz.id}/start/').data['id']
        q1 = quiz.questions.get(position=1)
        api_client.put(f'/api/v1/attempts/{attempt_id}/answers/', {'answers': [
            {'question_id': str(q1.id), 'selected_option_id': str(q1.options.get(is_correct=True).id)}]}, format='json')
        answer = api_client.get(f'/api/v1/attempts/{attempt_id}/').data['answers'][0]
        assert 'is_correct' not in answer and 'marks_awarded' not in answer

    def test_invalid_attempt_id_returns_400(self, api_client, student1, enrollment1, quiz):
        api_client.force_authenticate(user=student1)
        res = api_client.post(f'/api/v1/quizzes/{quiz.id}/submit/', {'attempt_id': 'not-a-uuid'}, format='json')
        assert res.status_code == status.HTTP_400_BAD_REQUEST

    def test_draft_quiz_hidden_from_students_but_visible_to_instructor(self, api_client, student1, instructor, enrollment1, quiz):
        quiz.status = 'DRAFT'
        quiz.save()
        api_client.force_authenticate(user=student1)
        assert api_client.get(f'/api/v1/quizzes/{quiz.id}/').status_code == status.HTTP_404_NOT_FOUND
        assert api_client.post(f'/api/v1/quizzes/{quiz.id}/start/').status_code == status.HTTP_404_NOT_FOUND
        api_client.force_authenticate(user=instructor)
        assert api_client.get(f'/api/v1/quizzes/{quiz.id}/').status_code == status.HTTP_200_OK

    def test_new_quizzes_default_to_draft(self, course):
        assert Quiz.objects.create(course=course, title='New quiz').status == 'DRAFT'

    def test_resume_returns_200_and_same_attempt(self, api_client, student1, enrollment1, quiz):
        api_client.force_authenticate(user=student1)
        first = api_client.post(f'/api/v1/quizzes/{quiz.id}/start/')
        second = api_client.post(f'/api/v1/quizzes/{quiz.id}/start/')
        assert first.status_code == status.HTTP_201_CREATED
        assert second.status_code == status.HTTP_200_OK and second.data['id'] == first.data['id']

    def test_malformed_answer_payload_is_rejected(self, api_client, student1, enrollment1, quiz):
        api_client.force_authenticate(user=student1)
        attempt_id = api_client.post(f'/api/v1/quizzes/{quiz.id}/start/').data['id']
        res = api_client.put(f'/api/v1/attempts/{attempt_id}/answers/', {'answers': [{'question_id': 'nope'}]}, format='json')
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        res = api_client.put(f'/api/v1/attempts/{attempt_id}/answers/', {'answers': 'oops'}, format='json')
        assert res.status_code == status.HTTP_400_BAD_REQUEST

    def test_answers_cannot_be_saved_after_submission(self, api_client, student1, enrollment1, quiz):
        api_client.force_authenticate(user=student1)
        attempt_id = api_client.post(f'/api/v1/quizzes/{quiz.id}/start/').data['id']
        api_client.post(f'/api/v1/attempts/{attempt_id}/submit/')
        q1 = quiz.questions.get(position=1)
        res = api_client.put(f'/api/v1/attempts/{attempt_id}/answers/', {'answers': [
            {'question_id': str(q1.id), 'selected_option_id': str(q1.options.get(is_correct=True).id)}]}, format='json')
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert QuizAttempt.objects.get(id=attempt_id).percentage == 0
