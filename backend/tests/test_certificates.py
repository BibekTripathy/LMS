import uuid
from decimal import Decimal
import pytest
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from users.models import User
from courses.models import Course, Module, Lesson
from enrollments.models import Enrollment
from progress.models import LessonProgress
from assessments.models import Quiz, Question, QuestionOption, QuizAttempt
from certificates.models import Certificate
from certificates.services import issue_certificate, check_course_completion


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def instructor():
    return User.objects.create_user(
        email="prof_feynman@example.com",
        password="password123",
        first_name="Richard",
        last_name="Feynman",
        role="INSTRUCTOR"
    )


@pytest.fixture
def student1():
    return User.objects.create_user(
        email="marie_curie@example.com",
        password="password123",
        first_name="Marie",
        last_name="Curie",
        role="STUDENT"
    )


@pytest.fixture
def student2():
    return User.objects.create_user(
        email="albert_einstein@example.com",
        password="password123",
        first_name="Albert",
        last_name="Einstein",
        role="STUDENT"
    )


@pytest.fixture
def course(instructor):
    return Course.objects.create(
        title="Quantum Mechanics and Electrodynamics",
        description="Comprehensive course on quantum physics",
        instructor=instructor,
        is_published=True,
        status="PUBLISHED"
    )


@pytest.fixture
def module(course):
    return Module.objects.create(
        course=course,
        title="Module 1: Foundations",
        order=1
    )


@pytest.fixture
def lessons(module):
    l1 = Lesson.objects.create(
        module=module,
        title="Lesson 1: Wave-Particle Duality",
        order=1,
        is_required=True
    )
    l2 = Lesson.objects.create(
        module=module,
        title="Lesson 2: Schrödinger Equation",
        order=2,
        is_required=True
    )
    return [l1, l2]


@pytest.fixture
def quiz(course, lessons):
    q = Quiz.objects.create(
        course=course,
        lesson=lessons[0],
        title="Quantum Foundations Quiz",
        time_limit_seconds=1800,
        pass_percentage=70,
        status="PUBLISHED"
    )
    q1 = Question.objects.create(
        quiz=q,
        prompt="What describes the quantum state of a particle?",
        marks=10,
        position=1
    )
    QuestionOption.objects.create(question=q1, text="Wave function", is_correct=True, position=1)
    QuestionOption.objects.create(question=q1, text="Velocity vector", is_correct=False, position=2)
    return q


@pytest.mark.django_db
class TestCertificateCriteriaAndIssuance:
    def test_certificate_not_issued_prematurely_uncompleted_lessons(
        self, api_client, student1, course, lessons, quiz
    ):
        enrollment = Enrollment.objects.create(student=student1, course=course, status='ACTIVE')

        # Complete only 1 out of 2 lessons
        LessonProgress.objects.create(
            enrollment=enrollment,
            lesson=lessons[0],
            last_position_seconds=180,
            completed=True
        )

        # Passed quiz with 100%
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

        # Eligibility check
        eligible, details = check_course_completion(student1, course)
        assert eligible is False
        assert details['all_lessons_completed'] is False
        assert details['all_quizzes_passed'] is True

        # API check
        api_client.force_authenticate(user=student1)
        res = api_client.get(f'/api/v1/courses/{course.id}/certificate/')
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert res.data['code'] == 'CRITERIA_NOT_MET'

        # Ensure no certificate exists in the database
        assert Certificate.objects.filter(student=student1, course=course).exists() is False

    def test_certificate_not_issued_prematurely_unpassed_quizzes(
        self, api_client, student1, course, lessons, quiz
    ):
        enrollment = Enrollment.objects.create(student=student1, course=course, status='ACTIVE')

        # Complete all lessons
        LessonProgress.objects.create(enrollment=enrollment, lesson=lessons[0], completed=True)
        LessonProgress.objects.create(enrollment=enrollment, lesson=lessons[1], completed=True)

        # Failed attempt on quiz: score 50% (< 70%)
        now = timezone.now()
        QuizAttempt.objects.create(
            quiz=quiz,
            student=student1,
            status='SUBMITTED',
            started_at=now,
            submitted_at=now,
            score=Decimal('5.00'),
            marks_obtained=Decimal('5.00'),
            total_marks_possible=10,
            percentage=Decimal('50.00'),
            passed=False
        )

        eligible, details = check_course_completion(student1, course)
        assert eligible is False
        assert details['all_lessons_completed'] is True
        assert details['all_quizzes_passed'] is False

        api_client.force_authenticate(user=student1)
        res = api_client.get(f'/api/v1/courses/{course.id}/certificate/')
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert res.data['code'] == 'CRITERIA_NOT_MET'
        assert Certificate.objects.filter(student=student1, course=course).exists() is False

    def test_certificate_not_issued_when_not_enrolled(self, api_client, student1, course, lessons):
        api_client.force_authenticate(user=student1)
        res = api_client.get(f'/api/v1/courses/{course.id}/certificate/')
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert res.data['code'] == 'CRITERIA_NOT_MET'
        assert Certificate.objects.filter(student=student1, course=course).exists() is False

    def test_certificate_issued_when_criteria_satisfied(
        self, api_client, student1, course, lessons, quiz
    ):
        enrollment = Enrollment.objects.create(student=student1, course=course, status='ACTIVE')

        # Complete all lessons
        LessonProgress.objects.create(enrollment=enrollment, lesson=lessons[0], completed=True)
        LessonProgress.objects.create(enrollment=enrollment, lesson=lessons[1], completed=True)

        # First attempt failed
        t1 = timezone.now() - timezone.timedelta(hours=1)
        QuizAttempt.objects.create(
            quiz=quiz,
            student=student1,
            status='SUBMITTED',
            started_at=t1,
            submitted_at=t1,
            score=Decimal('5.00'),
            marks_obtained=Decimal('5.00'),
            total_marks_possible=10,
            percentage=Decimal('50.00'),
            passed=False
        )

        # Retake attempt passed (highest score 100%)
        t2 = timezone.now()
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

        eligible, details = check_course_completion(student1, course)
        assert eligible is True
        assert details['all_lessons_completed'] is True
        assert details['all_quizzes_passed'] is True

        api_client.force_authenticate(user=student1)
        res = api_client.get(f'/api/v1/courses/{course.id}/certificate/')
        assert res.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]

        data = res.data
        assert str(data['student']) == str(student1.id)
        assert data['student_name'] == "Marie Curie"
        assert str(data['course']) == str(course.id)
        assert data['course_title'] == "Quantum Mechanics and Electrodynamics"
        assert data['instructor_name'] == "Richard Feynman"
        assert data['verification_code'].startswith("CERT-")
        assert len(data['verification_code']) > 6

        # Check enrollment status is now COMPLETED
        enrollment.refresh_from_db()
        assert enrollment.status == 'COMPLETED'

        # Fetching certificate again is idempotent and returns the same certificate
        res_repeat = api_client.get(f'/api/v1/courses/{course.id}/certificate/')
        assert res_repeat.status_code == status.HTTP_200_OK
        assert res_repeat.data['verification_code'] == data['verification_code']
        assert Certificate.objects.filter(student=student1, course=course).count() == 1

    def test_unique_constraints(self, student1, student2, course):
        code1 = "CERT-UNIQUE0001"
        Certificate.objects.create(
            student=student1,
            course=course,
            verification_code=code1
        )

        # Unique verification code constraint
        with transaction.atomic():
            with pytest.raises(IntegrityError):
                Certificate.objects.create(
                    student=student2,
                    course=course,
                    verification_code=code1
                )

        # Unique student per course constraint
        code2 = "CERT-UNIQUE0002"
        with transaction.atomic():
            with pytest.raises(IntegrityError):
                Certificate.objects.create(
                    student=student1,
                    course=course,
                    verification_code=code2
                )


@pytest.mark.django_db
class TestCertificateEndpoints:
    def test_my_certificates_endpoint(self, api_client, student1, student2, course):
        # Anonymous -> 401
        res_anon = api_client.get('/api/v1/certificates/me/')
        assert res_anon.status_code == status.HTTP_401_UNAUTHORIZED

        # Student with no certificates -> empty list
        api_client.force_authenticate(user=student1)
        res_empty = api_client.get('/api/v1/certificates/me/')
        assert res_empty.status_code == status.HTTP_200_OK
        assert res_empty.data == []

        # Issue certificate to student 1
        cert = Certificate.objects.create(
            student=student1,
            course=course,
            verification_code="CERT-MYCERTS01"
        )

        res_list = api_client.get('/api/v1/certificates/me/')
        assert res_list.status_code == status.HTTP_200_OK
        assert len(res_list.data) == 1
        assert res_list.data[0]['verification_code'] == "CERT-MYCERTS01"
        assert res_list.data[0]['student_name'] == "Marie Curie"

        # Student 2 cannot see student 1's certificate
        api_client.force_authenticate(user=student2)
        res_s2 = api_client.get('/api/v1/certificates/me/')
        assert res_s2.status_code == status.HTTP_200_OK
        assert res_s2.data == []

    def test_public_verify_endpoint(self, api_client, student1, course):
        cert = Certificate.objects.create(
            student=student1,
            course=course,
            verification_code="CERT-VERIFY1234"
        )

        # No authentication needed (public endpoint)
        api_client.force_authenticate(user=None)
        res = api_client.get(f'/api/v1/certificates/verify/{cert.verification_code}/')
        assert res.status_code == status.HTTP_200_OK

        data = res.data
        assert data['valid'] is True
        assert data['verification_code'] == "CERT-VERIFY1234"
        assert data['student_name'] == "Marie Curie"
        assert data['course_title'] == "Quantum Mechanics and Electrodynamics"
        assert data['instructor_name'] == "Richard Feynman"
        assert 'issued_at' in data

        # Security check: verify sensitive information is NOT leaked in public endpoint
        assert 'student' not in data
        assert 'email' not in data
        assert 'student_email' not in data
        assert 'id' not in data

        # Invalid verification code -> 404
        res_404 = api_client.get('/api/v1/certificates/verify/INVALID-NONEXISTENT-CODE/')
        assert res_404.status_code == status.HTTP_404_NOT_FOUND
        assert res_404.data['valid'] is False
        assert res_404.data['code'] == 'CERTIFICATE_NOT_FOUND'
