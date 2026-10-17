import pytest
from unittest.mock import patch
from rest_framework import status
from rest_framework.test import APIClient
from users.models import User
from courses.models import Course, Module, Lesson
from enrollments.models import Enrollment
from ai_resources.models import AIResource
from ai_resources.adapters.base import AITimeoutError, AIQuotaExceededError

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def setup_data():
    instructor = User.objects.create_user(email="prof@example.com", password="password", role="INSTRUCTOR")
    student1 = User.objects.create_user(email="s1@example.com", password="password", role="STUDENT")
    student2 = User.objects.create_user(email="s2@example.com", password="password", role="STUDENT")
    admin = User.objects.create_user(email="admin@example.com", password="password", role="ADMIN", is_staff=True)

    course = Course.objects.create(title="Machine Learning 101", instructor=instructor, is_published=True)
    module = Module.objects.create(course=course, title="Neural Networks", order=1)
    lesson = Lesson.objects.create(
        module=module,
        title="Backpropagation Basics",
        content="Backpropagation calculates the gradient of the loss function with respect to weights. "
                "It uses the chain rule from calculus to compute gradients efficiently. "
                "Stochastic gradient descent updates the weights using these computed gradients.",
        transcript="In this video we walk through the forward pass and backward pass using calculus chain rules.",
        order=1
    )
    empty_lesson = Lesson.objects.create(
        module=module,
        title="Empty Lesson",
        content="",
        reading_content="",
        transcript="",
        order=2
    )

    # Student 1 is enrolled in course; Student 2 is NOT enrolled
    Enrollment.objects.create(student=student1, course=course, status='ACTIVE')

    return {
        "instructor": instructor,
        "student1": student1,
        "student2": student2,
        "admin": admin,
        "course": course,
        "lesson": lesson,
        "empty_lesson": empty_lesson,
    }

@pytest.mark.django_db
class TestAIStudyResources:

    def test_unauthenticated_cannot_generate_ai_resource(self, api_client, setup_data):
        url = "/api/v1/ai/generate-flashcards/"
        response = api_client.post(url, {"lesson_id": str(setup_data["lesson"].id)})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_unenrolled_student_forbidden(self, api_client, setup_data):
        api_client.force_authenticate(user=setup_data["student2"])
        url = "/api/v1/ai/generate-flashcards/"
        response = api_client.post(url, {"lesson_id": str(setup_data["lesson"].id)})
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data["code"] == "ENROLLMENT_REQUIRED"

    def test_generate_flashcards_success(self, api_client, setup_data):
        api_client.force_authenticate(user=setup_data["student1"])
        url = "/api/v1/ai/generate-flashcards/"
        response = api_client.post(url, {"lesson_id": str(setup_data["lesson"].id)})
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["resource_type"] == "FLASHCARDS"
        assert "flashcards" in response.data["content"]
        assert len(response.data["content"]["flashcards"]) > 0
        card = response.data["content"]["flashcards"][0]
        assert "front" in card and "back" in card

        # Verify persisted in database
        persisted = AIResource.objects.get(id=response.data["id"])
        assert persisted.student == setup_data["student1"]
        assert persisted.lesson == setup_data["lesson"]
        assert persisted.resource_type == "FLASHCARDS"

    def test_generate_summary_success(self, api_client, setup_data):
        api_client.force_authenticate(user=setup_data["student1"])
        url = "/api/v1/ai/generate-summary/"
        response = api_client.post(url, {"lesson_id": str(setup_data["lesson"].id)})
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["resource_type"] == "SUMMARY"
        content = response.data["content"]
        assert "summary" in content and isinstance(content["summary"], str)
        assert "key_takeaways" in content and isinstance(content["key_takeaways"], list)
        assert len(content["key_takeaways"]) > 0

    def test_generate_mcqs_success(self, api_client, setup_data):
        api_client.force_authenticate(user=setup_data["student1"])
        url = "/api/v1/ai/generate-mcq/"
        response = api_client.post(url, {"lesson_id": str(setup_data["lesson"].id)})
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["resource_type"] == "MCQ_REVISION"
        mcqs = response.data["content"]["mcqs"]
        assert len(mcqs) > 0
        for mcq in mcqs:
            assert "question" in mcq
            assert "options" in mcq and len(mcq["options"]) >= 2
            assert "correct_index" in mcq and 0 <= mcq["correct_index"] < len(mcq["options"])
            assert "explanation" in mcq

    def test_insufficient_content_returns_400(self, api_client, setup_data):
        api_client.force_authenticate(user=setup_data["student1"])
        url = "/api/v1/ai/generate-summary/"
        response = api_client.post(url, {"lesson_id": str(setup_data["empty_lesson"].id)})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["code"] == "INSUFFICIENT_CONTENT"

    def test_instructor_and_admin_can_generate_without_enrollment(self, api_client, setup_data):
        # Instructor
        api_client.force_authenticate(user=setup_data["instructor"])
        res1 = api_client.post("/api/v1/ai/generate-flashcards/", {"lesson_id": str(setup_data["lesson"].id)})
        assert res1.status_code == status.HTTP_201_CREATED

        # Admin
        api_client.force_authenticate(user=setup_data["admin"])
        res2 = api_client.post("/api/v1/ai/generate-summary/", {"lesson_id": str(setup_data["lesson"].id)})
        assert res2.status_code == status.HTTP_201_CREATED

    def test_list_ai_resources_scoped_to_student(self, api_client, setup_data):
        # Create resource for student 1
        r1 = AIResource.objects.create(
            student=setup_data["student1"],
            lesson=setup_data["lesson"],
            resource_type="SUMMARY",
            content={"summary": "Student 1 summary", "key_takeaways": ["P1"]}
        )
        # Create resource for student 2
        r2 = AIResource.objects.create(
            student=setup_data["student2"],
            lesson=setup_data["lesson"],
            resource_type="SUMMARY",
            content={"summary": "Student 2 summary", "key_takeaways": ["P2"]}
        )

        api_client.force_authenticate(user=setup_data["student1"])
        response = api_client.get("/api/v1/ai/resources/")
        assert response.status_code == status.HTTP_200_OK
        ids = [item["id"] for item in response.data.get("results", response.data)]
        assert str(r1.id) in ids
        assert str(r2.id) not in ids

    def test_filter_resources_by_lesson_and_type(self, api_client, setup_data):
        AIResource.objects.create(
            student=setup_data["student1"],
            lesson=setup_data["lesson"],
            resource_type="SUMMARY",
            content={"summary": "Summary", "key_takeaways": ["T1"]}
        )
        AIResource.objects.create(
            student=setup_data["student1"],
            lesson=setup_data["lesson"],
            resource_type="FLASHCARDS",
            content={"flashcards": [{"front": "Q", "back": "A"}]}
        )

        api_client.force_authenticate(user=setup_data["student1"])
        url = f"/api/v1/ai/resources/?lesson_id={setup_data['lesson'].id}&resource_type=FLASHCARDS"
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", response.data)
        assert len(results) == 1
        assert results[0]["resource_type"] == "FLASHCARDS"

    def test_retrieve_and_delete_resource(self, api_client, setup_data):
        r = AIResource.objects.create(
            student=setup_data["student1"],
            lesson=setup_data["lesson"],
            resource_type="SUMMARY",
            content={"summary": "Summary", "key_takeaways": ["T1"]}
        )
        api_client.force_authenticate(user=setup_data["student1"])
        
        # GET
        get_res = api_client.get(f"/api/v1/ai/resources/{r.id}/")
        assert get_res.status_code == status.HTTP_200_OK
        assert get_res.data["id"] == str(r.id)

        # DELETE
        del_res = api_client.delete(f"/api/v1/ai/resources/{r.id}/")
        assert del_res.status_code == status.HTTP_204_NO_CONTENT
        assert not AIResource.objects.filter(id=r.id).exists()

    @patch("ai_resources.adapters.mock_adapter.MockAIAdapter.generate_summary")
    def test_ai_provider_timeout_handling(self, mock_summary, api_client, setup_data):
        mock_summary.side_effect = AITimeoutError("AI service request timed out.")
        api_client.force_authenticate(user=setup_data["student1"])

        response = api_client.post("/api/v1/ai/generate-summary/", {"lesson_id": str(setup_data["lesson"].id)})
        assert response.status_code == status.HTTP_504_GATEWAY_TIMEOUT
        assert response.data["code"] == "AI_TIMEOUT"

    @patch("ai_resources.adapters.mock_adapter.MockAIAdapter.generate_summary")
    def test_ai_provider_quota_exceeded_handling(self, mock_summary, api_client, setup_data):
        mock_summary.side_effect = AIQuotaExceededError("Rate limit exceeded.")
        api_client.force_authenticate(user=setup_data["student1"])

        response = api_client.post("/api/v1/ai/generate-summary/", {"lesson_id": str(setup_data["lesson"].id)})
        assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
        assert response.data["code"] == "AI_QUOTA_EXCEEDED"

    @patch("ai_resources.adapters.mock_adapter.MockAIAdapter.generate_summary")
    def test_ai_malformed_output_handling(self, mock_summary, api_client, setup_data):
        # Returns invalid schema (missing key_takeaways)
        mock_summary.return_value = {"summary": "Short", "wrong_key": 123}
        api_client.force_authenticate(user=setup_data["student1"])

        response = api_client.post("/api/v1/ai/generate-summary/", {"lesson_id": str(setup_data["lesson"].id)})
        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert response.data["code"] == "AI_MALFORMED_OUTPUT"
