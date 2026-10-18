import uuid
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.core.exceptions import ValidationError

from users.models import User
from courses.models import Course, Module, Lesson
from enrollments.models import Enrollment
from progress.models import LessonProgress


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def instructor():
    return User.objects.create_user(
        email="instructor@example.com",
        password="password123",
        role="INSTRUCTOR"
    )


@pytest.fixture
def student1():
    return User.objects.create_user(
        email="student1@example.com",
        password="password123",
        role="STUDENT"
    )


@pytest.fixture
def student2():
    return User.objects.create_user(
        email="student2@example.com",
        password="password123",
        role="STUDENT"
    )


@pytest.fixture
def course(instructor):
    return Course.objects.create(
        title="Full-Stack Web Engineering",
        description="Learn full-stack architectures",
        instructor=instructor,
        is_published=True,
        status="PUBLISHED"
    )


@pytest.fixture
def other_course(instructor):
    return Course.objects.create(
        title="Machine Learning Systems",
        description="ML in production",
        instructor=instructor,
        is_published=True,
        status="PUBLISHED"
    )


@pytest.fixture
def module(course):
    return Module.objects.create(
        course=course,
        title="Module 1: Introduction",
        order=1
    )


@pytest.fixture
def lesson1(module):
    return Lesson.objects.create(
        module=module,
        title="Lesson 1: Getting Started",
        content="Intro content",
        video_url="https://example.com/videos/lesson1.mp4",
        order=1
    )


@pytest.fixture
def lesson2(module):
    return Lesson.objects.create(
        module=module,
        title="Lesson 2: Core Concepts",
        content="Core concepts content",
        video_url="https://example.com/videos/lesson2.mp4",
        order=2
    )


@pytest.fixture
def other_lesson(other_course):
    module = Module.objects.create(
        course=other_course,
        title="ML Module 1",
        order=1
    )
    return Lesson.objects.create(
        module=module,
        title="ML Lesson 1",
        order=1
    )


@pytest.fixture
def enrollment1(student1, course):
    return Enrollment.objects.create(
        student=student1,
        course=course,
        status='ACTIVE'
    )


@pytest.mark.django_db
class TestProgressAccessControl:

    def test_unauthenticated_requests_are_rejected(self, api_client, lesson1, course):
        # GET progress
        res = api_client.get(f'/api/v1/lessons/{lesson1.id}/progress/')
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

        # PATCH progress
        res = api_client.patch(f'/api/v1/lessons/{lesson1.id}/progress/', {'last_position_seconds': 100})
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

        # POST complete
        res = api_client.post(f'/api/v1/lessons/{lesson1.id}/complete/')
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

        # GET course progress
        res = api_client.get(f'/api/v1/courses/{course.id}/progress/')
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

    def test_not_enrolled_student_cannot_access_or_update_progress(self, api_client, student2, lesson1, course):
        api_client.force_authenticate(user=student2)

        # GET progress should be 403 Forbidden
        res = api_client.get(f'/api/v1/lessons/{lesson1.id}/progress/')
        assert res.status_code == status.HTTP_403_FORBIDDEN

        # PATCH progress should be 403 Forbidden
        res = api_client.patch(f'/api/v1/lessons/{lesson1.id}/progress/', {'last_position_seconds': 50})
        assert res.status_code == status.HTTP_403_FORBIDDEN

        # POST complete should be 403 Forbidden
        res = api_client.post(f'/api/v1/lessons/{lesson1.id}/complete/')
        assert res.status_code == status.HTTP_403_FORBIDDEN

        # GET course progress should be 403 Forbidden
        res = api_client.get(f'/api/v1/courses/{course.id}/progress/')
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_student_cannot_access_lessons_from_non_enrolled_course(self, api_client, student1, enrollment1, other_lesson):
        api_client.force_authenticate(user=student1)

        # student1 is enrolled in `course`, but NOT in `other_course`
        res = api_client.get(f'/api/v1/lessons/{other_lesson.id}/progress/')
        assert res.status_code == status.HTTP_403_FORBIDDEN

        res = api_client.patch(f'/api/v1/lessons/{other_lesson.id}/progress/', {'last_position_seconds': 20})
        assert res.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestProgressPersistenceAndRestoration:

    def test_get_progress_initializes_and_returns_defaults(self, api_client, student1, enrollment1, lesson1):
        api_client.force_authenticate(user=student1)
        res = api_client.get(f'/api/v1/lessons/{lesson1.id}/progress/')

        assert res.status_code == status.HTTP_200_OK
        assert res.data['last_position_seconds'] == 0
        assert res.data['completed'] is False
        assert res.data['lesson_id'] == str(lesson1.id)
        assert res.data['enrollment_id'] == str(enrollment1.id)

        # Ensure saved in PostgreSQL
        progress_record = LessonProgress.objects.get(enrollment=enrollment1, lesson=lesson1)
        assert progress_record.last_position_seconds == 0
        assert progress_record.completed is False

    def test_patch_progress_persists_playback_position(self, api_client, student1, enrollment1, lesson1):
        api_client.force_authenticate(user=student1)
        res = api_client.patch(
            f'/api/v1/lessons/{lesson1.id}/progress/',
            {'last_position_seconds': 145}
        )
        assert res.status_code == status.HTTP_200_OK
        assert res.data['last_position_seconds'] == 145
        assert res.data['completed'] is False

        # Verify restoration on reopening the lesson
        restore_res = api_client.get(f'/api/v1/lessons/{lesson1.id}/progress/')
        assert restore_res.status_code == status.HTTP_200_OK
        assert restore_res.data['last_position_seconds'] == 145

        # Check database directly
        progress_record = LessonProgress.objects.get(enrollment=enrollment1, lesson=lesson1)
        assert progress_record.last_position_seconds == 145

    def test_patch_progress_with_timestamp_alias(self, api_client, student1, enrollment1, lesson1):
        api_client.force_authenticate(user=student1)
        res = api_client.patch(
            f'/api/v1/lessons/{lesson1.id}/progress/',
            {'timestamp': 210}
        )
        assert res.status_code == status.HTTP_200_OK
        assert res.data['last_position_seconds'] == 210

        progress_record = LessonProgress.objects.get(enrollment=enrollment1, lesson=lesson1)
        assert progress_record.last_position_seconds == 210

    def test_negative_position_is_rejected_with_400(self, api_client, student1, enrollment1, lesson1):
        api_client.force_authenticate(user=student1)
        res = api_client.patch(
            f'/api/v1/lessons/{lesson1.id}/progress/',
            {'last_position_seconds': -15}
        )
        assert res.status_code == status.HTTP_400_BAD_REQUEST

    def test_nonexistent_lesson_returns_404(self, api_client, student1, enrollment1):
        api_client.force_authenticate(user=student1)
        non_existent_id = uuid.uuid4()
        res = api_client.get(f'/api/v1/lessons/{non_existent_id}/progress/')
        assert res.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestLessonCompletion:

    def test_post_lesson_complete(self, api_client, student1, enrollment1, lesson1):
        api_client.force_authenticate(user=student1)
        res = api_client.post(f'/api/v1/lessons/{lesson1.id}/complete/')

        assert res.status_code == status.HTTP_200_OK
        assert res.data['completed'] is True

        # Verify persistence
        progress_record = LessonProgress.objects.get(enrollment=enrollment1, lesson=lesson1)
        assert progress_record.completed is True

        # Verify subsequent GET restores completed status
        get_res = api_client.get(f'/api/v1/lessons/{lesson1.id}/progress/')
        assert get_res.data['completed'] is True


@pytest.mark.django_db
class TestCourseProgressCalculation:

    def test_overall_course_progress_lifecycle(self, api_client, student1, enrollment1, course, lesson1, lesson2):
        api_client.force_authenticate(user=student1)

        # 1. Initially 0% complete
        res = api_client.get(f'/api/v1/courses/{course.id}/progress/')
        assert res.status_code == status.HTTP_200_OK
        assert res.data['course_id'] == str(course.id)
        assert res.data['total_lessons'] == 2
        assert res.data['completed_lessons'] == 0
        assert res.data['progress_percentage'] == 0.0
        assert res.data['is_completed'] is False

        # 2. Complete Lesson 1 -> 50%
        api_client.post(f'/api/v1/lessons/{lesson1.id}/complete/')
        res = api_client.get(f'/api/v1/courses/{course.id}/progress/')
        assert res.status_code == status.HTTP_200_OK
        assert res.data['completed_lessons'] == 1
        assert res.data['progress_percentage'] == 50.0
        assert res.data['is_completed'] is False

        # 3. Complete Lesson 2 -> 100%
        api_client.post(f'/api/v1/lessons/{lesson2.id}/complete/')
        res = api_client.get(f'/api/v1/courses/{course.id}/progress/')
        assert res.status_code == status.HTTP_200_OK
        assert res.data['completed_lessons'] == 2
        assert res.data['progress_percentage'] == 100.0
        assert res.data['is_completed'] is True

    def test_course_with_no_lessons(self, api_client, student1, instructor):
        empty_course = Course.objects.create(
            title="Empty Course",
            instructor=instructor,
            is_published=True,
            status="PUBLISHED"
        )
        Enrollment.objects.create(student=student1, course=empty_course, status='ACTIVE')

        api_client.force_authenticate(user=student1)
        res = api_client.get(f'/api/v1/courses/{empty_course.id}/progress/')
        assert res.status_code == status.HTTP_200_OK
        assert res.data['total_lessons'] == 0
        assert res.data['completed_lessons'] == 0
        assert res.data['progress_percentage'] == 0.0
        assert res.data['is_completed'] is False


@pytest.mark.django_db
class TestModelIntegrity:

    def test_unique_enrollment_lesson_constraint(self, enrollment1, lesson1):
        LessonProgress.objects.create(enrollment=enrollment1, lesson=lesson1, last_position_seconds=10)
        with pytest.raises(Exception):
            LessonProgress.objects.create(enrollment=enrollment1, lesson=lesson1, last_position_seconds=20)

    def test_clean_validates_lesson_belongs_to_enrolled_course(self, enrollment1, other_lesson):
        progress = LessonProgress(enrollment=enrollment1, lesson=other_lesson, last_position_seconds=10)
        with pytest.raises(ValidationError):
            progress.clean()


@pytest.mark.django_db
class TestCompletionRules:
    def test_completion_cannot_be_reverted_by_client(self, api_client, student1, enrollment1, lesson1):
        api_client.force_authenticate(user=student1)
        api_client.post(f'/api/v1/lessons/{lesson1.id}/complete/')
        res = api_client.patch(f'/api/v1/lessons/{lesson1.id}/progress/', {'completed': False, 'last_position_seconds': 10}, format='json')
        assert res.status_code == status.HTTP_200_OK
        assert res.data['completed'] is True
        assert res.data['last_position_seconds'] == 10

    def test_optional_lessons_do_not_block_course_completion(self, api_client, student1, enrollment1, course, lesson1, lesson2):
        lesson2.is_required = False
        lesson2.save()
        api_client.force_authenticate(user=student1)
        api_client.post(f'/api/v1/lessons/{lesson1.id}/complete/')
        res = api_client.get(f'/api/v1/courses/{course.id}/progress/')
        assert res.data['total_lessons'] == 2
        assert res.data['completed_lessons'] == 1
        assert res.data['required_lessons'] == 1
        assert res.data['completed_required_lessons'] == 1
        assert res.data['progress_percentage'] == 100.0
        assert res.data['is_completed'] is True
