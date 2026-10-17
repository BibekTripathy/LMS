from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from courses.models import Lesson, Course
from .permissions import CanAccessAndModifyLessonProgress, IsEnrolledInCourse
from .serializers import (
    LessonProgressSerializer,
    LessonProgressUpdateSerializer,
    CourseProgressSerializer
)
from .services import (
    get_or_create_lesson_progress,
    update_lesson_progress,
    mark_lesson_completed,
    calculate_course_progress
)


class LessonProgressView(APIView):
    """
    GET: Retrieve the authenticated student's saved progress for a lesson.
         Restores latest persisted position.
    PATCH: Update playback position and/or completion state in PostgreSQL.
    """
    permission_classes = [IsAuthenticated, CanAccessAndModifyLessonProgress]

    def get_lesson(self, lesson_id):
        lesson = get_object_or_404(
            Lesson.objects.select_related('module__course'),
            id=lesson_id
        )
        self.check_object_permissions(self.request, lesson)
        return lesson

    def get(self, request, id):
        lesson = self.get_lesson(id)
        progress = get_or_create_lesson_progress(request.user, lesson)
        serializer = LessonProgressSerializer(progress)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, id):
        lesson = self.get_lesson(id)
        serializer = LessonProgressUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        progress = update_lesson_progress(
            user=request.user,
            lesson=lesson,
            last_position_seconds=serializer.validated_data.get('last_position_seconds'),
            completed=serializer.validated_data.get('completed')
        )
        response_serializer = LessonProgressSerializer(progress)
        return Response(response_serializer.data, status=status.HTTP_200_OK)


class LessonCompleteView(APIView):
    """
    POST: Mark a lesson as completed for the authenticated enrolled student.
    """
    permission_classes = [IsAuthenticated, CanAccessAndModifyLessonProgress]

    def post(self, request, id):
        lesson = get_object_or_404(
            Lesson.objects.select_related('module__course'),
            id=id
        )
        self.check_object_permissions(request, lesson)

        progress = mark_lesson_completed(request.user, lesson)
        serializer = LessonProgressSerializer(progress)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CourseProgressView(APIView):
    """
    GET: Calculate overall course progress for the authenticated enrolled student.
    """
    permission_classes = [IsAuthenticated, IsEnrolledInCourse]

    def get(self, request, id):
        course = get_object_or_404(Course, id=id)
        self.check_object_permissions(request, course)

        progress_data = calculate_course_progress(request.user, course)
        serializer = CourseProgressSerializer(progress_data)
        return Response(serializer.data, status=status.HTTP_200_OK)
