from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from courses.models import Lesson
from .models import AIResource
from .serializers import AIResourceSerializer, GenerateAIResourceRequestSerializer
from .permissions import CanRequestAIResourceForLesson, IsResourceOwnerOrAdmin
from .adapters import (
    get_ai_adapter,
    AIAdapterError,
    AITimeoutError,
    AIQuotaExceededError,
    AIValidationError
)
from .validators import (
    validate_summary_output,
    validate_flashcards_output,
    validate_mcqs_output
)

class BaseGenerateAIView(APIView):
    """
    Base view handling lesson validation, enrollment checking,
    content extraction, and unified error handling for AI generation.
    """
    permission_classes = [IsAuthenticated]

    def _get_authorized_lesson(self, request, lesson_id):
        lesson = get_object_or_404(
            Lesson.objects.select_related('module__course', 'module__course__instructor'),
            id=lesson_id
        )
        perm = CanRequestAIResourceForLesson()
        if not perm.has_object_permission(request, self, lesson):
            return None, Response(
                {
                    "error": "You must be enrolled in this course to generate AI study resources.",
                    "code": "ENROLLMENT_REQUIRED"
                },
                status=status.HTTP_403_FORBIDDEN
            )
        return lesson, None

    def _extract_lesson_content(self, lesson):
        # Prioritize transcript if video lesson, fallback to content or reading_content
        text_parts = []
        if lesson.transcript and lesson.transcript.strip():
            text_parts.append(lesson.transcript.strip())
        if lesson.content and lesson.content.strip():
            text_parts.append(lesson.content.strip())
        if lesson.reading_content and lesson.reading_content.strip() and lesson.reading_content != lesson.content:
            text_parts.append(lesson.reading_content.strip())

        combined_text = "\n\n".join(text_parts).strip()
        if not combined_text:
            return None, Response(
                {
                    "error": "This lesson does not have sufficient content or transcript for AI study resource generation.",
                    "code": "INSUFFICIENT_CONTENT"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        return combined_text, None

    def _handle_ai_error(self, exc):
        if isinstance(exc, AITimeoutError):
            return Response(
                {"error": exc.message, "code": exc.code},
                status=status.HTTP_504_GATEWAY_TIMEOUT
            )
        if isinstance(exc, AIQuotaExceededError):
            return Response(
                {"error": exc.message, "code": exc.code},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        if isinstance(exc, AIValidationError):
            return Response(
                {"error": exc.message, "code": exc.code},
                status=status.HTTP_502_BAD_GATEWAY
            )
        if isinstance(exc, AIAdapterError):
            return Response(
                {"error": exc.message, "code": exc.code},
                status=exc.status_code
            )
        return Response(
            {"error": f"Internal error during AI generation: {str(exc)}", "code": "AI_SERVER_ERROR"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class GenerateFlashcardsView(BaseGenerateAIView):
    """
    POST /api/v1/ai/generate-flashcards/
    Generates, stores, and returns structured flashcards for the specified lesson.
    """
    def post(self, request):
        serializer = GenerateAIResourceRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "Validation error", "code": "VALIDATION_ERROR", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        lesson, err_resp = self._get_authorized_lesson(request, serializer.validated_data['lesson_id'])
        if err_resp:
            return err_resp

        content, err_resp = self._extract_lesson_content(lesson)
        if err_resp:
            return err_resp

        adapter = get_ai_adapter()
        try:
            raw_result = adapter.generate_flashcards(lesson.title, content)
            validated_content = validate_flashcards_output(raw_result)
        except Exception as exc:
            return self._handle_ai_error(exc)

        resource = AIResource.objects.create(
            student=request.user,
            lesson=lesson,
            resource_type='FLASHCARDS',
            content=validated_content
        )

        return Response(
            AIResourceSerializer(resource, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class GenerateSummaryView(BaseGenerateAIView):
    """
    POST /api/v1/ai/generate-summary/
    Generates, stores, and returns a structured summary with key takeaways for the lesson.
    """
    def post(self, request):
        serializer = GenerateAIResourceRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "Validation error", "code": "VALIDATION_ERROR", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        lesson, err_resp = self._get_authorized_lesson(request, serializer.validated_data['lesson_id'])
        if err_resp:
            return err_resp

        content, err_resp = self._extract_lesson_content(lesson)
        if err_resp:
            return err_resp

        adapter = get_ai_adapter()
        try:
            raw_result = adapter.generate_summary(lesson.title, content)
            validated_content = validate_summary_output(raw_result)
        except Exception as exc:
            return self._handle_ai_error(exc)

        resource = AIResource.objects.create(
            student=request.user,
            lesson=lesson,
            resource_type='SUMMARY',
            content=validated_content
        )

        return Response(
            AIResourceSerializer(resource, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class GenerateMCQView(BaseGenerateAIView):
    """
    POST /api/v1/ai/generate-mcq/
    Generates, stores, and returns revision MCQs for the lesson.
    """
    def post(self, request):
        serializer = GenerateAIResourceRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "Validation error", "code": "VALIDATION_ERROR", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        lesson, err_resp = self._get_authorized_lesson(request, serializer.validated_data['lesson_id'])
        if err_resp:
            return err_resp

        content, err_resp = self._extract_lesson_content(lesson)
        if err_resp:
            return err_resp

        adapter = get_ai_adapter()
        try:
            raw_result = adapter.generate_mcqs(lesson.title, content)
            validated_content = validate_mcqs_output(raw_result)
        except Exception as exc:
            return self._handle_ai_error(exc)

        resource = AIResource.objects.create(
            student=request.user,
            lesson=lesson,
            resource_type='MCQ_REVISION',
            content=validated_content
        )

        return Response(
            AIResourceSerializer(resource, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class AIResourceListView(generics.ListAPIView):
    """
    GET /api/v1/ai/resources/
    Lists AI resources owned by the requesting student.
    Supports filtering by ?lesson_id=<uuid> and ?resource_type=<type>.
    """
    serializer_class = AIResourceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = AIResource.objects.all().select_related(
            'student', 'lesson', 'lesson__module__course'
        )

        if not (user.role == 'ADMIN' or user.is_staff or user.is_superuser):
            queryset = queryset.filter(student=user)

        lesson_id = self.request.query_params.get('lesson_id')
        if lesson_id:
            queryset = queryset.filter(lesson_id=lesson_id)

        resource_type = self.request.query_params.get('resource_type')
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type.upper())

        return queryset


class AIResourceDetailView(generics.RetrieveDestroyAPIView):
    """
    GET /api/v1/ai/resources/{id}/
    DELETE /api/v1/ai/resources/{id}/
    Retrieves or deletes a specific AI study resource owned by the student.
    """
    queryset = AIResource.objects.all().select_related(
        'student', 'lesson', 'lesson__module__course'
    )
    serializer_class = AIResourceSerializer
    permission_classes = [IsAuthenticated, IsResourceOwnerOrAdmin]
    lookup_field = 'id'
