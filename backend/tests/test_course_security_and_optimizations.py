import pytest
from rest_framework import status
from rest_framework.test import APIClient
from users.models import User
from courses.models import Course, Module, Lesson
from enrollments.models import Enrollment

@pytest.fixture
def api_client():
    return APIClient()

@pytest.mark.django_db
class TestCourseSecurityAndOptimizations:

    def test_unenrolled_user_cannot_see_video_url_in_course_detail(self, api_client):
        instructor = User.objects.create_user(email="inst@example.com", password="password", role="INSTRUCTOR")
        student = User.objects.create_user(email="stud@example.com", password="password", role="STUDENT")
        course = Course.objects.create(title="Python Course", instructor=instructor, is_published=True)
        module = Module.objects.create(course=course, title="Module 1", order=1)
        lesson = Lesson.objects.create(
            module=module,
            title="Lesson 1",
            video_url="https://example.com/secret_video.mp4",
            order=1
        )

        # 1. Unauthenticated request
        response = api_client.get(f"/api/v1/courses/{course.id}/")
        assert response.status_code == status.HTTP_200_OK
        module_data = response.data['modules'][0]
        assert module_data['lessons'][0]['video_url'] is None

        # 2. Authenticated but unenrolled student request
        api_client.force_authenticate(user=student)
        response = api_client.get(f"/api/v1/courses/{course.id}/")
        assert response.status_code == status.HTTP_200_OK
        module_data = response.data['modules'][0]
        assert module_data['lessons'][0]['video_url'] is None

    def test_enrolled_user_and_instructor_can_see_video_url_in_course_detail(self, api_client):
        instructor = User.objects.create_user(email="inst2@example.com", password="password", role="INSTRUCTOR")
        student = User.objects.create_user(email="stud2@example.com", password="password", role="STUDENT")
        course = Course.objects.create(title="Django Course", instructor=instructor, is_published=True)
        module = Module.objects.create(course=course, title="Module 1", order=1)
        Lesson.objects.create(
            module=module,
            title="Lesson 1",
            video_url="https://example.com/secret_video.mp4",
            order=1
        )

        # Enrolled student
        Enrollment.objects.create(student=student, course=course, status='ACTIVE')
        api_client.force_authenticate(user=student)
        response = api_client.get(f"/api/v1/courses/{course.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data['modules'][0]['lessons'][0]['video_url'] == "https://example.com/secret_video.mp4"

        # Instructor
        api_client.force_authenticate(user=instructor)
        response = api_client.get(f"/api/v1/courses/{course.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data['modules'][0]['lessons'][0]['video_url'] == "https://example.com/secret_video.mp4"

    def test_module_and_lesson_auto_ordering(self, api_client):
        instructor = User.objects.create_user(email="inst3@example.com", password="password", role="INSTRUCTOR")
        course = Course.objects.create(title="FastAPI Course", instructor=instructor, is_published=True)
        api_client.force_authenticate(user=instructor)

        # Create module 1 without order
        res1 = api_client.post(f"/api/v1/courses/{course.id}/modules/", {"title": "Module 1"})
        assert res1.status_code == status.HTTP_201_CREATED
        assert res1.data['order'] == 1

        # Create module 2 without order (should auto-increment to 2)
        res2 = api_client.post(f"/api/v1/courses/{course.id}/modules/", {"title": "Module 2"})
        assert res2.status_code == status.HTTP_201_CREATED
        assert res2.data['order'] == 2

        module1_id = res1.data['id']
        # Create lesson 1 without order
        l1 = api_client.post(f"/api/v1/modules/{module1_id}/lessons/", {"title": "Lesson 1"})
        assert l1.status_code == status.HTTP_201_CREATED
        assert l1.data['order'] == 1

        # Create lesson 2 without order
        l2 = api_client.post(f"/api/v1/modules/{module1_id}/lessons/", {"title": "Lesson 2"})
        assert l2.status_code == status.HTTP_201_CREATED
        assert l2.data['order'] == 2
