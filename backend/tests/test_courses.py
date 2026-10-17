import pytest
from rest_framework import status
from rest_framework.test import APIClient
from users.models import User
from courses.models import Course, Module, Lesson
from enrollments.models import Enrollment

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def instructor():
    return User.objects.create_user(
        email="instructor1@example.com",
        password="password123",
        role="INSTRUCTOR"
    )

@pytest.fixture
def instructor2():
    return User.objects.create_user(
        email="instructor2@example.com",
        password="password123",
        role="INSTRUCTOR"
    )

@pytest.fixture
def student():
    return User.objects.create_user(
        email="student1@example.com",
        password="password123",
        role="STUDENT"
    )

@pytest.fixture
def admin_user():
    return User.objects.create_superuser(
        email="admin@example.com",
        password="password123"
    )

@pytest.fixture
def published_course(instructor):
    course = Course.objects.create(
        title="Python Web Development",
        description="Learn Django and React",
        category="Web Development",
        difficulty="BEGINNER",
        instructor=instructor,
        is_published=True,
        status="PUBLISHED"
    )
    module = Module.objects.create(course=course, title="Module 1: Basics", order=1)
    Lesson.objects.create(
        module=module,
        title="Lesson 1: Intro",
        content="Intro to Python",
        video_url="https://example.com/video1.mp4",
        transcript="Hello and welcome to Python development.",
        order=1
    )
    return course

@pytest.fixture
def draft_course(instructor):
    return Course.objects.create(
        title="Draft Advanced Systems",
        description="Internal draft",
        category="Systems",
        difficulty="ADVANCED",
        instructor=instructor,
        is_published=False,
        status="DRAFT"
    )


@pytest.mark.django_db
class TestCourseManagement:

    def test_student_cannot_create_course(self, api_client, student):
        api_client.force_authenticate(user=student)
        response = api_client.post('/api/v1/courses/', {
            "title": "Hacked Course",
            "description": "I am a student"
        })
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_instructor_can_create_course(self, api_client, instructor):
        api_client.force_authenticate(user=instructor)
        response = api_client.post('/api/v1/courses/', {
            "title": "Database Engineering",
            "description": "Relational schemas and SQL",
            "category": "Databases",
            "difficulty": "INTERMEDIATE"
        })
        assert response.status_code == status.HTTP_201_CREATED
        course = Course.objects.get(title="Database Engineering")
        assert course.instructor == instructor
        assert course.is_published is False
        assert course.status == "DRAFT"

    def test_public_course_list_only_shows_published(self, api_client, published_course, draft_course):
        response = api_client.get('/api/v1/courses/')
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        titles = [c['title'] for c in results]
        assert published_course.title in titles
        assert draft_course.title not in titles

    def test_course_search_and_filter(self, api_client, published_course):
        # Search by keyword
        response = api_client.get('/api/v1/courses/?search=Python')
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        assert len(results) == 1
        assert results[0]['title'] == published_course.title

        # Filter by category
        response_cat = api_client.get('/api/v1/courses/?category=Web Development')
        assert response_cat.status_code == status.HTTP_200_OK
        results_cat = response_cat.data.get('results', response_cat.data)
        assert len(results_cat) == 1

        # Non-matching category
        response_none = api_client.get('/api/v1/courses/?category=NonExistent')
        results_none = response_none.data.get('results', response_none.data)
        assert len(results_none) == 0

    def test_instructor_cannot_edit_other_instructor_course(self, api_client, published_course, instructor2):
        api_client.force_authenticate(user=instructor2)
        response = api_client.patch(f'/api/v1/courses/{published_course.id}/', {
            "title": "Hijacked Title"
        })
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_owner_instructor_can_edit_course(self, api_client, published_course, instructor):
        api_client.force_authenticate(user=instructor)
        response = api_client.patch(f'/api/v1/courses/{published_course.id}/', {
            "title": "Updated Python Web Development"
        })
        assert response.status_code == status.HTTP_200_OK
        published_course.refresh_from_db()
        assert published_course.title == "Updated Python Web Development"

    def test_publish_and_archive_endpoints(self, api_client, draft_course, instructor):
        api_client.force_authenticate(user=instructor)
        # Publish
        pub_response = api_client.post(f'/api/v1/courses/{draft_course.id}/publish/')
        assert pub_response.status_code == status.HTTP_200_OK
        draft_course.refresh_from_db()
        assert draft_course.is_published is True
        assert draft_course.status == "PUBLISHED"

        # Archive
        arch_response = api_client.post(f'/api/v1/courses/{draft_course.id}/archive/')
        assert arch_response.status_code == status.HTTP_200_OK
        draft_course.refresh_from_db()
        assert draft_course.is_published is False
        assert draft_course.status == "ARCHIVED"


@pytest.mark.django_db
class TestModuleAndLessonHierarchy:

    def test_module_creation_and_ordering(self, api_client, published_course, instructor):
        api_client.force_authenticate(user=instructor)
        response = api_client.post(f'/api/v1/courses/{published_course.id}/modules/', {
            "title": "Module 2: Advanced Topics",
            "order": 2
        })
        assert response.status_code == status.HTTP_201_CREATED
        assert Module.objects.filter(course=published_course, order=2).exists()

    def test_lesson_access_authorization(self, api_client, published_course, student, instructor, admin_user):
        lesson = Lesson.objects.filter(module__course=published_course).first()

        # 1. Unauthenticated request
        anon_res = api_client.get(f'/api/v1/lessons/{lesson.id}/')
        assert anon_res.status_code == status.HTTP_401_UNAUTHORIZED

        # 2. Unenrolled student
        api_client.force_authenticate(user=student)
        unenrolled_res = api_client.get(f'/api/v1/lessons/{lesson.id}/')
        assert unenrolled_res.status_code == status.HTTP_403_FORBIDDEN

        # 3. Enrolled student
        Enrollment.objects.create(student=student, course=published_course, status='ACTIVE')
        enrolled_res = api_client.get(f'/api/v1/lessons/{lesson.id}/')
        assert enrolled_res.status_code == status.HTTP_200_OK
        assert enrolled_res.data['transcript'] == "Hello and welcome to Python development."

        # 4. Course instructor
        api_client.force_authenticate(user=instructor)
        inst_res = api_client.get(f'/api/v1/lessons/{lesson.id}/')
        assert inst_res.status_code == status.HTTP_200_OK

        # 5. Platform Admin
        api_client.force_authenticate(user=admin_user)
        admin_res = api_client.get(f'/api/v1/lessons/{lesson.id}/')
        assert admin_res.status_code == status.HTTP_200_OK
