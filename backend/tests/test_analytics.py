import uuid
from decimal import Decimal
import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from users.models import User
from courses.models import Course, Module, Lesson
from enrollments.models import Enrollment
from progress.models import LessonProgress
from assessments.models import Quiz, Question, QuestionOption, QuizAttempt, Answer


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user():
    return User.objects.create_superuser(
        email="admin@example.com",
        password="adminpassword123"
    )


@pytest.fixture
def instructor():
    return User.objects.create_user(
        email="instructor1@example.com",
        password="password123",
        first_name="Prof",
        last_name="Alan",
        role="INSTRUCTOR"
    )


@pytest.fixture
def other_instructor():
    return User.objects.create_user(
        email="instructor2@example.com",
        password="password123",
        first_name="Prof",
        last_name="Ada",
        role="INSTRUCTOR"
    )


@pytest.fixture
def student1():
    return User.objects.create_user(
        email="alice@example.com",
        password="password123",
        first_name="Alice",
        last_name="Smith",
        role="STUDENT"
    )


@pytest.fixture
def student2():
    return User.objects.create_user(
        email="bob@example.com",
        password="password123",
        first_name="Bob",
        last_name="Jones",
        role="STUDENT"
    )


@pytest.fixture
def student3():
    return User.objects.create_user(
        email="charlie@example.com",
        password="password123",
        first_name="Charlie",
        last_name="Brown",
        role="STUDENT"
    )


@pytest.fixture
def course(instructor):
    return Course.objects.create(
        title="Distributed Systems Engineering",
        description="Core principles of distributed architectures",
        instructor=instructor,
        is_published=True,
        status="PUBLISHED"
    )


@pytest.fixture
def module(course):
    return Module.objects.create(
        course=course,
        title="Module 1: Consensus",
        order=1
    )


@pytest.fixture
def lessons(module):
    l1 = Lesson.objects.create(
        module=module,
        title="Lesson 1: Paxos",
        order=1,
        is_required=True
    )
    l2 = Lesson.objects.create(
        module=module,
        title="Lesson 2: Raft",
        order=2,
        is_required=True
    )
    return [l1, l2]


@pytest.fixture
def quiz(course, lessons):
    q = Quiz.objects.create(
        course=course,
        lesson=lessons[0],
        title="Consensus Mechanisms Quiz",
        time_limit_seconds=1800,
        pass_percentage=70,
        status="PUBLISHED"
    )
    # Question 1
    q1 = Question.objects.create(
        quiz=q,
        prompt="What is the leader election algorithm in Raft?",
        marks=5,
        position=1
    )
    QuestionOption.objects.create(question=q1, text="Heartbeat and randomized timer", is_correct=True, position=1)
    QuestionOption.objects.create(question=q1, text="Two-phase commit", is_correct=False, position=2)

    # Question 2
    q2 = Question.objects.create(
        quiz=q,
        prompt="In Paxos, what role proposes values?",
        marks=5,
        position=2
    )
    QuestionOption.objects.create(question=q2, text="Proposer", is_correct=True, position=1)
    QuestionOption.objects.create(question=q2, text="Acceptor", is_correct=False, position=2)

    return q


# ==========================================
# 1. Student Analytics Tests (/api/v1/analytics/student/)
# ==========================================

@pytest.mark.django_db
class TestStudentAnalytics:
    def test_student_analytics_empty(self, api_client, student1):
        api_client.force_authenticate(user=student1)
        response = api_client.get('/api/v1/analytics/student/')
        assert response.status_code == status.HTTP_200_OK

        data = response.data
        assert data['total_enrolled_courses'] == 0
        assert data['completed_courses'] == 0
        assert data['total_lessons_completed'] == 0
        assert data['overall_completion_rate'] == 0.0
        assert data['average_assessment_score'] == 0.0
        assert data['courses'] == []
        assert data['recent_activity'] == []
        assert data['recent_quiz_attempts'] == []

    def test_student_analytics_with_data(self, api_client, student1, course, lessons, quiz):
        # Enroll student
        enrollment = Enrollment.objects.create(student=student1, course=course, status='ACTIVE')

        # Complete 1 out of 2 lessons
        LessonProgress.objects.create(
            enrollment=enrollment,
            lesson=lessons[0],
            last_position_seconds=120,
            completed=True
        )
        LessonProgress.objects.create(
            enrollment=enrollment,
            lesson=lessons[1],
            last_position_seconds=45,
            completed=False
        )

        # Submitted attempt with 100% score (10/10)
        now = timezone.now()
        attempt = QuizAttempt.objects.create(
            quiz=quiz,
            student=student1,
            status='SUBMITTED',
            started_at=now,
            submitted_at=now,
            score=Decimal('10.00'),
            marks_obtained=Decimal('10.00'),
            total_marks_possible=10,
            percentage=Decimal('100.00'),
            passed=True
        )

        api_client.force_authenticate(user=student1)
        response = api_client.get('/api/v1/analytics/student/')
        assert response.status_code == status.HTTP_200_OK

        data = response.data
        assert data['total_enrolled_courses'] == 1
        assert data['total_lessons_completed'] == 1
        assert data['total_lessons_count'] == 2
        assert data['overall_completion_rate'] == 50.0
        assert data['total_quiz_attempts'] == 1
        assert data['quizzes_passed'] == 1
        assert data['average_assessment_score'] == 100.0

        # Course breakdown
        assert len(data['courses']) == 1
        c_stats = data['courses'][0]
        assert str(c_stats['course_id']) == str(course.id)
        assert c_stats['total_lessons'] == 2
        assert c_stats['completed_lessons'] == 1
        assert c_stats['progress_percentage'] == 50.0
        assert c_stats['is_completed'] is False
        assert c_stats['average_quiz_score'] == 100.0

        # Recent activity and quiz attempts
        assert len(data['recent_activity']) == 2
        assert len(data['recent_quiz_attempts']) == 1
        assert data['recent_quiz_attempts'][0]['score'] == 10.0
        assert data['recent_quiz_attempts'][0]['course_title'] == course.title

    def test_student_analytics_permissions(self, api_client, student1, instructor, admin_user):
        # Anonymous -> 401
        res_anon = api_client.get('/api/v1/analytics/student/')
        assert res_anon.status_code == status.HTTP_401_UNAUTHORIZED

        # Student -> 200
        api_client.force_authenticate(user=student1)
        res_stud = api_client.get('/api/v1/analytics/student/')
        assert res_stud.status_code == status.HTTP_200_OK

        # Instructor -> 403 Forbidden (strict role-based permission)
        api_client.force_authenticate(user=instructor)
        res_inst = api_client.get('/api/v1/analytics/student/')
        assert res_inst.status_code == status.HTTP_403_FORBIDDEN

        # Admin -> 200
        api_client.force_authenticate(user=admin_user)
        res_adm = api_client.get('/api/v1/analytics/student/')
        assert res_adm.status_code == status.HTTP_200_OK


# ==========================================
# 2. Course Analytics Tests (/api/v1/courses/{id}/analytics/)
# ==========================================

@pytest.mark.django_db
class TestCourseAnalytics:
    def test_course_analytics_empty(self, api_client, instructor, course):
        api_client.force_authenticate(user=instructor)
        response = api_client.get(f'/api/v1/courses/{course.id}/analytics/')
        assert response.status_code == status.HTTP_200_OK

        data = response.data
        assert str(data['course_id']) == str(course.id)
        assert data['total_enrollments'] == 0
        assert data['active_enrollments'] == 0
        assert data['completed_enrollments'] == 0
        assert data['completion_rate'] == 0.0
        assert data['average_quiz_score'] == 0.0
        assert data['quiz_pass_rate'] == 0.0
        assert data['students'] == []

    def test_course_analytics_with_data(
        self, api_client, instructor, course, lessons, quiz, student1, student2
    ):
        # Enroll student 1 and student 2
        e1 = Enrollment.objects.create(student=student1, course=course, status='ACTIVE')
        e2 = Enrollment.objects.create(student=student2, course=course, status='COMPLETED')

        # Student 1 completed lesson 1
        LessonProgress.objects.create(enrollment=e1, lesson=lessons[0], last_position_seconds=60, completed=True)
        # Student 2 completed lesson 1 and 2
        LessonProgress.objects.create(enrollment=e2, lesson=lessons[0], last_position_seconds=90, completed=True)
        LessonProgress.objects.create(enrollment=e2, lesson=lessons[1], last_position_seconds=120, completed=True)

        now = timezone.now()
        # Student 1 attempt: 80% (passed)
        QuizAttempt.objects.create(
            quiz=quiz,
            student=student1,
            status='SUBMITTED',
            started_at=now,
            submitted_at=now,
            score=Decimal('8.00'),
            marks_obtained=Decimal('8.00'),
            total_marks_possible=10,
            percentage=Decimal('80.00'),
            passed=True
        )
        # Student 2 attempt: 60% (failed, threshold is 70)
        QuizAttempt.objects.create(
            quiz=quiz,
            student=student2,
            status='SUBMITTED',
            started_at=now,
            submitted_at=now,
            score=Decimal('6.00'),
            marks_obtained=Decimal('6.00'),
            total_marks_possible=10,
            percentage=Decimal('60.00'),
            passed=False
        )

        api_client.force_authenticate(user=instructor)
        response = api_client.get(f'/api/v1/courses/{course.id}/analytics/')
        assert response.status_code == status.HTTP_200_OK

        data = response.data
        assert data['total_enrollments'] == 2
        assert data['active_enrollments'] == 1
        assert data['completed_enrollments'] == 1
        assert data['completion_rate'] == 50.0  # 1 out of 2 completed
        assert data['total_lessons'] == 2
        assert data['total_quizzes'] == 1
        assert data['total_quiz_attempts'] == 2
        assert data['average_quiz_score'] == 70.0  # avg of 80 and 60
        assert data['quiz_pass_rate'] == 50.0  # 1 passed out of 2

        # Verify enrolled students breakdown
        students_list = data['students']
        assert len(students_list) == 2
        s1_data = next(s for s in students_list if str(s['student_id']) == str(student1.id))
        s2_data = next(s for s in students_list if str(s['student_id']) == str(student2.id))

        assert s1_data['completed_lessons_count'] == 1
        assert s1_data['progress_percentage'] == 50.0
        assert s1_data['average_quiz_score'] == 80.0

        assert s2_data['completed_lessons_count'] == 2
        assert s2_data['progress_percentage'] == 100.0
        assert s2_data['average_quiz_score'] == 60.0

        # Lessons breakdown
        assert len(data['lessons_breakdown']) == 2
        l1_data = next(l for l in data['lessons_breakdown'] if str(l['lesson_id']) == str(lessons[0].id))
        assert l1_data['completed_count'] == 2
        assert l1_data['completion_rate'] == 100.0

    def test_course_analytics_lessons_follow_module_order(self, api_client, instructor, course, module, lessons):
        later = Module.objects.create(course=course, title="Module 2", order=2)
        Lesson.objects.create(module=later, title="M2 first lesson", order=1)
        api_client.force_authenticate(user=instructor)
        titles = [l['title'] for l in api_client.get(f'/api/v1/courses/{course.id}/analytics/').data['lessons_breakdown']]
        assert titles == ["Lesson 1: Paxos", "Lesson 2: Raft", "M2 first lesson"]

    def test_course_analytics_permissions(
        self, api_client, instructor, other_instructor, student1, admin_user, course
    ):
        # Anonymous -> 401
        res_anon = api_client.get(f'/api/v1/courses/{course.id}/analytics/')
        assert res_anon.status_code == status.HTTP_401_UNAUTHORIZED

        # Enrolled student -> 403 Forbidden
        Enrollment.objects.create(student=student1, course=course, status='ACTIVE')
        api_client.force_authenticate(user=student1)
        res_stud = api_client.get(f'/api/v1/courses/{course.id}/analytics/')
        assert res_stud.status_code == status.HTTP_403_FORBIDDEN

        # Other instructor (not owner) -> 403 Forbidden
        api_client.force_authenticate(user=other_instructor)
        res_other = api_client.get(f'/api/v1/courses/{course.id}/analytics/')
        assert res_other.status_code == status.HTTP_403_FORBIDDEN

        # Course owner -> 200 OK
        api_client.force_authenticate(user=instructor)
        res_owner = api_client.get(f'/api/v1/courses/{course.id}/analytics/')
        assert res_owner.status_code == status.HTTP_200_OK

        # Admin -> 200 OK
        api_client.force_authenticate(user=admin_user)
        res_admin = api_client.get(f'/api/v1/courses/{course.id}/analytics/')
        assert res_admin.status_code == status.HTTP_200_OK

        # Non-existent course -> 404 Not Found
        res_404 = api_client.get(f'/api/v1/courses/{uuid.uuid4()}/analytics/')
        assert res_404.status_code == status.HTTP_404_NOT_FOUND


# ==========================================
# 3. Admin Analytics Tests (/api/v1/analytics/admin/)
# ==========================================

@pytest.mark.django_db
class TestAdminAnalytics:
    def test_admin_analytics_permissions(self, api_client, student1, instructor, admin_user):
        # Anonymous -> 401
        res_anon = api_client.get('/api/v1/analytics/admin/')
        assert res_anon.status_code == status.HTTP_401_UNAUTHORIZED

        # Student -> 403
        api_client.force_authenticate(user=student1)
        res_stud = api_client.get('/api/v1/analytics/admin/')
        assert res_stud.status_code == status.HTTP_403_FORBIDDEN

        # Instructor -> 403
        api_client.force_authenticate(user=instructor)
        res_inst = api_client.get('/api/v1/analytics/admin/')
        assert res_inst.status_code == status.HTTP_403_FORBIDDEN

        # Admin -> 200
        api_client.force_authenticate(user=admin_user)
        res_adm = api_client.get('/api/v1/analytics/admin/')
        assert res_adm.status_code == status.HTTP_200_OK

    def test_admin_analytics_aggregations(
        self, api_client, admin_user, instructor, student1, student2, course, lessons, quiz
    ):
        Enrollment.objects.create(student=student1, course=course, status='ACTIVE')
        Enrollment.objects.create(student=student2, course=course, status='COMPLETED')

        now = timezone.now()
        QuizAttempt.objects.create(
            quiz=quiz,
            student=student1,
            status='SUBMITTED',
            started_at=now,
            submitted_at=now,
            score=Decimal('10.00'),
            marks_obtained=Decimal('10.00'),
            total_marks_possible=10,
            percentage=Decimal('100.00'),
            passed=True
        )

        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/v1/analytics/admin/')
        assert response.status_code == status.HTTP_200_OK

        data = response.data
        assert data['users']['total_users'] >= 3
        assert data['users']['total_students'] >= 2
        assert data['users']['total_instructors'] >= 1
        assert data['courses']['total_courses'] >= 1
        assert data['courses']['published_courses'] >= 1
        assert data['enrollments']['total_enrollments'] == 2
        assert data['enrollments']['active_enrollments'] == 1
        assert data['enrollments']['completed_enrollments'] == 1
        assert data['assessments']['total_quizzes'] >= 1
        assert data['assessments']['submitted_quiz_attempts'] == 1
        assert data['assessments']['average_quiz_score'] == 100.0


# ==========================================
# 4. Quiz Leaderboard Tests (/api/v1/quizzes/{id}/leaderboard/)
# ==========================================

@pytest.mark.django_db
class TestQuizLeaderboard:
    def test_leaderboard_empty(self, api_client, student1, course, quiz):
        Enrollment.objects.create(student=student1, course=course, status='ACTIVE')

        api_client.force_authenticate(user=student1)
        response = api_client.get(f'/api/v1/quizzes/{quiz.id}/leaderboard/')
        assert response.status_code == status.HTTP_200_OK

        data = response.data
        assert str(data['quiz_id']) == str(quiz.id)
        assert data['total_participants'] == 0
        assert data['leaderboard'] == []
        assert data['my_entry'] is None

    def test_leaderboard_ranking_accuracy_best_score_per_student(
        self, api_client, course, quiz, student1, student2, student3
    ):
        # Enroll all students
        Enrollment.objects.create(student=student1, course=course, status='ACTIVE')
        Enrollment.objects.create(student=student2, course=course, status='ACTIVE')
        Enrollment.objects.create(student=student3, course=course, status='ACTIVE')

        t1 = timezone.now() - timezone.timedelta(hours=2)
        t2 = timezone.now() - timezone.timedelta(hours=1)

        # Student 1 attempts twice: 60% on first attempt, 100% on second attempt
        QuizAttempt.objects.create(
            quiz=quiz,
            student=student1,
            status='SUBMITTED',
            started_at=t1,
            submitted_at=t1,
            score=Decimal('6.00'),
            marks_obtained=Decimal('6.00'),
            total_marks_possible=10,
            percentage=Decimal('60.00'),
            passed=False
        )
        QuizAttempt.objects.create(
            quiz=quiz,
            student=student1,
            status='SUBMITTED',
            started_at=t2,
            submitted_at=t2,
            score=Decimal('10.00'),
            marks_obtained=Decimal('10.00'),
            total_marks_possible=10,
            percentage=Decimal('100.00'),
            passed=True
        )

        # Student 2 attempts once: 80%
        QuizAttempt.objects.create(
            quiz=quiz,
            student=student2,
            status='SUBMITTED',
            started_at=t1,
            submitted_at=t1,
            score=Decimal('8.00'),
            marks_obtained=Decimal('8.00'),
            total_marks_possible=10,
            percentage=Decimal('80.00'),
            passed=True
        )

        # Student 3 attempts once: 50%
        QuizAttempt.objects.create(
            quiz=quiz,
            student=student3,
            status='SUBMITTED',
            started_at=t1,
            submitted_at=t1,
            score=Decimal('5.00'),
            marks_obtained=Decimal('5.00'),
            total_marks_possible=10,
            percentage=Decimal('50.00'),
            passed=False
        )

        # In-progress attempt by another student should NOT appear on leaderboard
        unranked_student = User.objects.create_user(
            email="unranked@example.com",
            password="password123",
            role="STUDENT"
        )
        Enrollment.objects.create(student=unranked_student, course=course, status='ACTIVE')
        QuizAttempt.objects.create(
            quiz=quiz,
            student=unranked_student,
            status='IN_PROGRESS',
            started_at=t1,
            total_marks_possible=10
        )

        # Query leaderboard as student2
        api_client.force_authenticate(user=student2)
        response = api_client.get(f'/api/v1/quizzes/{quiz.id}/leaderboard/')
        assert response.status_code == status.HTTP_200_OK

        data = response.data
        assert data['total_participants'] == 3
        board = data['leaderboard']

        # Verifying Rank 1: Student 1 (best score 10 / 100%)
        assert board[0]['rank'] == 1
        assert str(board[0]['student_id']) == str(student1.id)
        assert board[0]['best_score'] == 10.0
        assert board[0]['highest_percentage'] == 100.0
        assert board[0]['total_attempts'] == 2
        assert board[0]['passed'] is True

        # Verifying Rank 2: Student 2 (best score 8 / 80%)
        assert board[1]['rank'] == 2
        assert str(board[1]['student_id']) == str(student2.id)
        assert board[1]['best_score'] == 8.0
        assert board[1]['highest_percentage'] == 80.0
        assert board[1]['total_attempts'] == 1
        assert board[1]['passed'] is True

        # Verifying Rank 3: Student 3 (best score 5 / 50%)
        assert board[2]['rank'] == 3
        assert str(board[2]['student_id']) == str(student3.id)
        assert board[2]['best_score'] == 5.0
        assert board[2]['highest_percentage'] == 50.0
        assert board[2]['total_attempts'] == 1
        assert board[2]['passed'] is False

        # Verifying my_entry for Student 2
        assert data['my_entry'] is not None
        assert data['my_entry']['rank'] == 2
        assert str(data['my_entry']['student_id']) == str(student2.id)

    def test_leaderboard_permissions(
        self, api_client, course, quiz, instructor, student1, student2, admin_user
    ):
        # Anonymous -> 401
        res_anon = api_client.get(f'/api/v1/quizzes/{quiz.id}/leaderboard/')
        assert res_anon.status_code == status.HTTP_401_UNAUTHORIZED

        # Non-enrolled student -> 403 Forbidden
        api_client.force_authenticate(user=student1)
        res_un_enrolled = api_client.get(f'/api/v1/quizzes/{quiz.id}/leaderboard/')
        assert res_un_enrolled.status_code == status.HTTP_403_FORBIDDEN

        # Enrolled student -> 200 OK
        Enrollment.objects.create(student=student1, course=course, status='ACTIVE')
        res_enrolled = api_client.get(f'/api/v1/quizzes/{quiz.id}/leaderboard/')
        assert res_enrolled.status_code == status.HTTP_200_OK

        # Course instructor -> 200 OK
        api_client.force_authenticate(user=instructor)
        res_inst = api_client.get(f'/api/v1/quizzes/{quiz.id}/leaderboard/')
        assert res_inst.status_code == status.HTTP_200_OK

        # Admin -> 200 OK
        api_client.force_authenticate(user=admin_user)
        res_admin = api_client.get(f'/api/v1/quizzes/{quiz.id}/leaderboard/')
        assert res_admin.status_code == status.HTTP_200_OK

        # Draft quiz is hidden from students (404)
        draft_quiz = Quiz.objects.create(
            course=course,
            title="Draft Quiz",
            status="DRAFT"
        )
        api_client.force_authenticate(user=student1)
        res_draft = api_client.get(f'/api/v1/quizzes/{draft_quiz.id}/leaderboard/')
        assert res_draft.status_code == status.HTTP_404_NOT_FOUND

        # Draft quiz visible to instructor (200)
        api_client.force_authenticate(user=instructor)
        res_draft_inst = api_client.get(f'/api/v1/quizzes/{draft_quiz.id}/leaderboard/')
        assert res_draft_inst.status_code == status.HTTP_200_OK
