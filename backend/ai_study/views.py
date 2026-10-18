from django.shortcuts import get_object_or_404
from rest_framework import exceptions, generics, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from assessments.serializers import QuizDetailSerializer
from courses.models import Course, Lesson

from . import services
from .models import StudyResource
from .providers.base import AIError
from .serializers import GenerateRequestSerializer, StudyResourceSerializer, StudyResourceUpdateSerializer
from .services import ServiceError
from .validators import ContentValidationError


def error_response(message, code, http_status, details=None, headers=None):
    body = {'error': message, 'code': code}
    if details:
        body['details'] = details
    return Response(body, status=http_status, headers=headers)


class AIStudyAPIMixin:
    """Render every failure in the project's {error, code, details} format."""

    def handle_exception(self, exc):
        if isinstance(exc, AIError):
            headers = {'Retry-After': str(exc.retry_after)} if exc.retry_after else None
            return error_response(exc.message, exc.code, exc.http_status, headers=headers)
        if isinstance(exc, ServiceError):
            return error_response(exc.message, exc.code, exc.http_status)
        if isinstance(exc, ContentValidationError):
            return error_response('Content is invalid.', 'VALIDATION_ERROR', status.HTTP_400_BAD_REQUEST,
                                  details={'content': exc.errors})

        response = super().handle_exception(exc)
        if isinstance(exc, exceptions.ValidationError):
            response.data = {'error': 'Validation error', 'code': 'VALIDATION_ERROR', 'details': response.data}
        elif isinstance(exc, exceptions.APIException):
            code = 'RATE_LIMITED' if isinstance(exc, exceptions.Throttled) else str(exc.get_codes()).upper()
            response.data = {'error': str(exc.detail), 'code': code}
        return response


def _forbidden(message='Only the course instructor can manage AI study resources.'):
    return error_response(message, 'NOT_COURSE_INSTRUCTOR', status.HTTP_403_FORBIDDEN)


def _get_resource(pk):
    return get_object_or_404(
        StudyResource.objects.select_related('course', 'lesson', 'lesson__module'), pk=pk
    )


def _get_lesson(pk):
    return get_object_or_404(Lesson.objects.select_related('module__course'), pk=pk)


class LessonGenerateView(AIStudyAPIMixin, APIView):
    """POST /api/v1/lessons/{id}/ai/generate/ — course instructor creates a DRAFT resource."""
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'ai_generate'

    def post(self, request, id):
        lesson = _get_lesson(id)
        if not services.can_manage_course(request.user, lesson.module.course):
            return _forbidden()
        serializer = GenerateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        resource = services.generate_lesson_resource(
            request.user, lesson,
            serializer.validated_data['resource_type'],
            serializer.validated_data.get('count'),
        )
        return Response(StudyResourceSerializer(resource).data, status=status.HTTP_201_CREATED)


class LessonResourceListView(AIStudyAPIMixin, generics.ListAPIView):
    """GET /api/v1/lessons/{id}/resources/ — all resources for the instructor, published ones for enrolled students."""
    serializer_class = StudyResourceSerializer

    def get_queryset(self):
        lesson = _get_lesson(self.kwargs['id'])
        course = lesson.module.course
        queryset = StudyResource.objects.filter(lesson=lesson).select_related('course', 'lesson')
        if services.can_manage_course(self.request.user, course):
            pass
        elif services.has_active_enrollment(self.request.user, course):
            queryset = queryset.filter(status=StudyResource.STATUS_PUBLISHED)
        else:
            raise exceptions.PermissionDenied('You must be enrolled in this course to view its study resources.')
        resource_type = self.request.query_params.get('resource_type')
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type.upper())
        return queryset


class StudyResourceDetailView(AIStudyAPIMixin, APIView):
    """GET / PATCH /api/v1/resources/{id}/"""

    def get(self, request, id):
        resource = _get_resource(id)
        if not services.can_view_resource(request.user, resource):
            raise exceptions.NotFound('Resource not found.')
        return Response(StudyResourceSerializer(resource).data)

    def patch(self, request, id):
        resource = _get_resource(id)
        if resource.is_revision or not services.can_manage_course(request.user, resource.course):
            return _forbidden()
        serializer = StudyResourceUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        resource = services.update_resource_content(resource, serializer.validated_data['content'])
        return Response(StudyResourceSerializer(resource).data)


class StudyResourcePublishView(AIStudyAPIMixin, APIView):
    """POST /api/v1/resources/{id}/publish/"""

    def post(self, request, id):
        resource = _get_resource(id)
        if resource.is_revision or not services.can_manage_course(request.user, resource.course):
            return _forbidden()
        resource = services.publish_resource(resource)
        return Response(StudyResourceSerializer(resource).data)


class StudyResourceConvertView(AIStudyAPIMixin, APIView):
    """POST /api/v1/resources/{id}/convert-to-quiz/ — returns the new DRAFT quiz (instructor view)."""

    def post(self, request, id):
        resource = _get_resource(id)
        if resource.is_revision or not services.can_manage_course(request.user, resource.course):
            return _forbidden()
        quiz = services.convert_mcq_to_quiz(resource)
        return Response(QuizDetailSerializer(quiz).data, status=status.HTTP_201_CREATED)


class CourseRevisionView(AIStudyAPIMixin, generics.ListAPIView):
    """
    GET  /api/v1/courses/{id}/ai/revisions/ — the requesting student's own revision summaries.
    POST /api/v1/courses/{id}/ai/revisions/ — generate one from their submitted quiz attempts.
    """
    serializer_class = StudyResourceSerializer
    throttle_scope = 'ai_generate'

    def get_throttles(self):
        return [ScopedRateThrottle()] if self.request.method == 'POST' else []

    def _course(self):
        course = get_object_or_404(Course, pk=self.kwargs['id'])
        if not services.has_active_enrollment(self.request.user, course):
            raise exceptions.PermissionDenied('You must be enrolled in this course.')
        return course

    def get_queryset(self):
        return StudyResource.objects.filter(
            course=self._course(),
            created_by=self.request.user,
            resource_type=StudyResource.TYPE_REVISION,
        ).select_related('course')

    def post(self, request, id):
        resource = services.generate_revision(request.user, self._course())
        return Response(StudyResourceSerializer(resource).data, status=status.HTTP_201_CREATED)
