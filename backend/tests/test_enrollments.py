import pytest
from rest_framework import status
from rest_framework.test import APIClient
from users.models import User
from courses.models import Course
from enrollments.models import Enrollment

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def instructor():
    return User.objects.create_user(
        email="inst@example.com",
        password="password123",
        role="INSTRUCTOR"
    )

@pytest.fixture
def student():
    return User.objects.create_user(
        email="stud@example.com",
        password="password123",
        role="STUDENT"
    )

@pytest.fixture
def student2():
    return User.objects.create_user(
        email="stud2@example.com",
        password="password123",
        role="STUDENT"
    )

@pytest.fixture
def published_course(instructor):
    return Course.objects.create(
        title="Distributed Systems",
        description="Scaling backend architectures",
        instructor=instructor,
        is_published=True,
        status="PUBLISHED"
    )

@pytest.fixture
def unpublished_course(instructor):
    return Course.objects.create(
        title="Unpublished Draft Course",
        description="Not ready for students",
        instructor=instructor,
        is_published=False,
        status="DRAFT"
    )


@pytest.mark.django_db
class TestEnrollmentsFlow:

    def test_student_can_enroll_in_published_course(self, api_client, student, published_course):
        api_client.force_authenticate(user=student)
        url = f'/api/v1/courses/{published_course.id}/enroll/'
        response = api_client.post(url)
        assert response.status_code == status.HTTP_201_CREATED
        assert Enrollment.objects.filter(student=student, course=published_course, status='ACTIVE').exists()

    def test_duplicate_enrollment_is_prevented(self, api_client, student, published_course):
        api_client.force_authenticate(user=student)
        url = f'/api/v1/courses/{published_course.id}/enroll/'
        # First enrollment
        first_res = api_client.post(url)
        assert first_res.status_code == status.HTTP_201_CREATED

        # Duplicate enrollment attempt
        dup_res = api_client.post(url)
        assert dup_res.status_code == status.HTTP_400_BAD_REQUEST
        assert dup_res.data['code'] == 'ALREADY_ENROLLED'
        assert Enrollment.objects.filter(student=student, course=published_course).count() == 1

    def test_cannot_enroll_in_unpublished_course(self, api_client, student, unpublished_course):
        api_client.force_authenticate(user=student)
        url = f'/api/v1/courses/{unpublished_course.id}/enroll/'
        response = api_client.post(url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['code'] == 'COURSE_NOT_PUBLISHED'

    def test_my_enrollments_endpoint(self, api_client, student, published_course):
        Enrollment.objects.create(student=student, course=published_course, status='ACTIVE')
        api_client.force_authenticate(user=student)
        response = api_client.get('/api/v1/enrollments/me/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['course_detail']['title'] == published_course.title

    def test_course_students_list_restricted_to_owner(self, api_client, instructor, student, student2, published_course):
        Enrollment.objects.create(student=student, course=published_course, status='ACTIVE')
        Enrollment.objects.create(student=student2, course=published_course, status='ACTIVE')

        # Student cannot view enrolled students list
        api_client.force_authenticate(user=student)
        unauth_res = api_client.get(f'/api/v1/courses/{published_course.id}/students/')
        assert unauth_res.status_code == status.HTTP_403_FORBIDDEN

        # Course owner instructor can view
        api_client.force_authenticate(user=instructor)
        owner_res = api_client.get(f'/api/v1/courses/{published_course.id}/students/')
        assert owner_res.status_code == status.HTTP_200_OK
        assert len(owner_res.data) == 2
