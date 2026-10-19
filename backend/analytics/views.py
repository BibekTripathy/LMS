from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from courses.models import Course
from assessments.models import Quiz
from .permissions import (
    IsStudentOrAdmin,
    IsCourseInstructorOrAdmin,
    IsAdminOnly,
    CanAccessQuizLeaderboard,
)
from .services import (
    get_student_analytics,
    get_course_analytics,
    get_admin_analytics,
    get_quiz_leaderboard,
)
from .serializers import (
    StudentAnalyticsSerializer,
    CourseAnalyticsSerializer,
    AdminAnalyticsSerializer,
    QuizLeaderboardSerializer,
)


class StudentAnalyticsView(APIView):
    """
    GET /api/v1/analytics/student/
    Computes student progress, completion rates, and average assessment scores
    from persisted PostgreSQL records.
    Accessible only to students and platform administrators.
    """
    permission_classes = [IsAuthenticated, IsStudentOrAdmin]

    def get(self, request):
        data = get_student_analytics(request.user)
        serializer = StudentAnalyticsSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CourseAnalyticsView(APIView):
    """
    GET /api/v1/courses/{id}/analytics/
    Computes course-level and student-level statistics for course instructors
    and platform administrators.
    Strictly forbids students and instructors who do not own the course.
    """
    permission_classes = [IsAuthenticated, IsCourseInstructorOrAdmin]

    def get(self, request, id):
        course = get_object_or_404(Course.objects.select_related('instructor'), id=id)
        self.check_object_permissions(request, course)

        data = get_course_analytics(course)
        serializer = CourseAnalyticsSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminAnalyticsView(APIView):
    """
    GET /api/v1/analytics/admin/
    Computes platform-wide statistics from persisted database records.
    Accessible only to administrators.
    """
    permission_classes = [IsAuthenticated, IsAdminOnly]

    def get(self, request):
        data = get_admin_analytics()
        serializer = AdminAnalyticsSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class QuizLeaderboardView(APIView):
    """
    GET /api/v1/quizzes/{id}/leaderboard/
    Calculates the leaderboard (best score per student) using PostgreSQL ranking queries.
    Accessible to actively enrolled students, course instructor, and administrators.
    """
    permission_classes = [IsAuthenticated, CanAccessQuizLeaderboard]

    def get(self, request, id):
        quiz = get_object_or_404(Quiz.objects.select_related('course'), id=id)
        self.check_object_permissions(request, quiz)

        limit_param = request.query_params.get('limit')
        limit = None
        if limit_param is not None:
            try:
                limit = int(limit_param)
            except (ValueError, TypeError):
                limit = None

        data = get_quiz_leaderboard(quiz, requesting_user=request.user, limit=limit)
        serializer = QuizLeaderboardSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)
