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


from django.db import models as db_models
from assessments.models import QuizAttempt
from enrollments.models import Enrollment
from ai_study.models import AIResource


class StudentAnalyticsView(APIView):
    """
    GET: Retrieve aggregated performance and engagement analytics for the authenticated student.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        enrollments = Enrollment.objects.filter(student=user, status='ACTIVE').select_related('course')
        total_enrolled = enrollments.count()

        completed_courses = 0
        for enrollment in enrollments:
            try:
                progress = calculate_course_progress(user, enrollment.course)
                if progress.get('is_completed'):
                    completed_courses += 1
            except Exception:
                pass

        submitted_attempts = QuizAttempt.objects.filter(
            student=user, status='SUBMITTED'
        ).select_related('quiz', 'quiz__course')

        total_quizzes_taken = submitted_attempts.count()

        avg_res = submitted_attempts.filter(percentage__isnull=False).aggregate(
            avg_score=db_models.Avg('percentage')
        )
        average_quiz_percentage = round(float(avg_res['avg_score']), 1) if avg_res['avg_score'] is not None else 0.0

        study_resources_count = AIResource.objects.filter(
            db_models.Q(created_by=user) |
            db_models.Q(status='PUBLISHED', course__enrollments__student=user, course__enrollments__status='ACTIVE')
        ).distinct().count()

        recent_attempts = []
        for attempt in submitted_attempts.order_by('-submitted_at', '-started_at')[:5]:
            recent_attempts.append({
                'quiz_id': str(attempt.quiz_id),
                'quiz_title': attempt.quiz.title,
                'course_title': attempt.quiz.course.title if attempt.quiz and attempt.quiz.course else 'Course',
                'score_percentage': float(attempt.percentage or 0.0),
                'passed': bool(attempt.passed),
                'date': (attempt.submitted_at or attempt.started_at).isoformat(),
            })

        return Response({
            'total_enrolled': total_enrolled,
            'completed_courses': completed_courses,
            'total_quizzes_taken': total_quizzes_taken,
            'average_quiz_percentage': average_quiz_percentage,
            'study_resources_count': study_resources_count,
            'recent_attempts': recent_attempts,
        }, status=status.HTTP_200_OK)

