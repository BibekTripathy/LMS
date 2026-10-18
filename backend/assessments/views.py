from django.db import transaction
from django.db.models import Max
from django.shortcuts import get_object_or_404
from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Quiz, Question, QuizAttempt
from .permissions import CanAccessQuiz, IsAttemptStudent
from courses.models import Course
from enrollments.models import Enrollment
from courses.permissions import IsCourseOwnerOrAdmin, IsInstructorOrAdmin
from .serializers import (
    QuizDetailSerializer,
    QuizAttemptSerializer,
    QuizAttemptDetailSerializer,
    QuizResultsMeSerializer,
    QuizCreateSerializer,
    QuestionCreateSerializer,
    QuestionReviewSerializer,
)
from .services import (
    start_quiz_attempt,
    save_attempt_answers,
    submit_and_grade_attempt,
    get_student_quiz_results
)


class QuizDetailView(APIView):
    """
    GET /api/v1/quizzes/{id}/
    Returns quiz details and question structure without exposing correct answers.
    """
    permission_classes = [IsAuthenticated, CanAccessQuiz]

    def get(self, request, id):
        quiz = get_object_or_404(Quiz.objects.prefetch_related('questions__options'), id=id)
        self.check_object_permissions(request, quiz)

        serializer = QuizDetailSerializer(quiz)
        return Response(serializer.data, status=status.HTTP_200_OK)


class QuizStartView(APIView):
    """
    POST /api/v1/quizzes/{id}/start/
    Starts a new attempt or resumes an active, unexpired attempt.
    """
    permission_classes = [IsAuthenticated, CanAccessQuiz]

    def post(self, request, id):
        quiz = get_object_or_404(Quiz, id=id)
        self.check_object_permissions(request, quiz)

        attempt = start_quiz_attempt(request.user, quiz)
        serializer = QuizAttemptSerializer(attempt)
        code = status.HTTP_200_OK if getattr(attempt, 'resumed', False) else status.HTTP_201_CREATED
        return Response(serializer.data, status=code)


class AttemptDetailView(APIView):
    """
    GET /api/v1/attempts/{id}/
    Retrieves the current attempt state and answers for the student.
    """
    permission_classes = [IsAuthenticated, IsAttemptStudent]

    def get(self, request, id):
        attempt = get_object_or_404(
            QuizAttempt.objects.select_related('quiz').prefetch_related('answers', 'quiz__questions__options'),
            id=id
        )
        self.check_object_permissions(request, attempt)

        serializer = QuizAttemptDetailSerializer(attempt)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AttemptAnswersView(APIView):
    """
    PUT /api/v1/attempts/{id}/answers/
    Saves student answers for an active attempt.
    """
    permission_classes = [IsAuthenticated, IsAttemptStudent]

    def put(self, request, id):
        attempt = get_object_or_404(QuizAttempt.objects.select_related('quiz'), id=id)
        self.check_object_permissions(request, attempt)

        saved_answers = save_attempt_answers(request.user, attempt, request.data)
        return Response(
            {
                "message": "Answers saved successfully",
                "saved_count": len(saved_answers)
            },
            status=status.HTTP_200_OK
        )


class AttemptSubmitView(APIView):
    """
    POST /api/v1/attempts/{id}/submit/
    Submits and grades an attempt on the server using an atomic transaction.
    """
    permission_classes = [IsAuthenticated, IsAttemptStudent]

    def post(self, request, id):
        attempt = get_object_or_404(QuizAttempt.objects.select_related('quiz'), id=id)
        self.check_object_permissions(request, attempt)

        answers_data = request.data.get('answers') if isinstance(request.data, dict) else None
        graded_attempt = submit_and_grade_attempt(request.user, attempt, answers_data=answers_data)

        serializer = QuizAttemptDetailSerializer(graded_attempt)
        return Response(serializer.data, status=status.HTTP_200_OK)


class QuizSubmitView(APIView):
    """
    POST /api/v1/quizzes/{id}/submit/
    Alternate submit endpoint taking attempt_id in request body.
    """
    permission_classes = [IsAuthenticated, CanAccessQuiz]

    def post(self, request, id):
        quiz = get_object_or_404(Quiz, id=id)
        self.check_object_permissions(request, quiz)

        try:
            attempt_id = serializers.UUIDField().to_internal_value(request.data.get('attempt_id'))
        except serializers.ValidationError:
            return Response(
                {"error": "attempt_id must be a valid UUID", "code": "VALIDATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST
            )

        attempt = get_object_or_404(QuizAttempt.objects.select_related('quiz'), id=attempt_id, quiz=quiz)
        if attempt.student != request.user:
            return Response(
                {"error": "You do not have permission to submit this attempt."},
                status=status.HTTP_403_FORBIDDEN
            )

        answers_data = request.data.get('answers')
        graded_attempt = submit_and_grade_attempt(request.user, attempt, answers_data=answers_data)

        serializer = QuizAttemptDetailSerializer(graded_attempt)
        return Response(serializer.data, status=status.HTTP_200_OK)


class QuizResultsMeView(APIView):
    """
    GET /api/v1/quizzes/{id}/results/me/
    Returns the student's attempt history and best score summary.
    """
    permission_classes = [IsAuthenticated, CanAccessQuiz]

    def get(self, request, id):
        quiz = get_object_or_404(Quiz, id=id)
        self.check_object_permissions(request, quiz)

        results_data = get_student_quiz_results(request.user, quiz)
        serializer = QuizResultsMeSerializer(results_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


def _can_manage(user, course):
    return getattr(user, 'role', '') == 'ADMIN' or user.is_staff or user.is_superuser or course.instructor_id == user.id


class CourseQuizListView(APIView):
    """
    GET /api/v1/courses/{course_id}/quizzes/
        Course instructor/admin: every quiz with answers (authoring view).
        Actively enrolled student: published quizzes only, without answers.
    POST /api/v1/courses/{course_id}/quizzes/  (course instructor/admin)
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsInstructorOrAdmin()]
        return [IsAuthenticated()]

    def get(self, request, course_id):
        course = get_object_or_404(Course, id=course_id)
        quizzes = course.quizzes.all().prefetch_related('questions__options')

        if _can_manage(request.user, course):
            return Response(QuizCreateSerializer(quizzes, many=True).data, status=status.HTTP_200_OK)

        if not Enrollment.objects.filter(student=request.user, course=course, status='ACTIVE').exists():
            return Response(
                {"error": "You must be enrolled in this course to view its quizzes.", "code": "ENROLLMENT_REQUIRED"},
                status=status.HTTP_403_FORBIDDEN
            )
        return Response(QuizDetailSerializer(quizzes.filter(status='PUBLISHED'), many=True).data, status=status.HTTP_200_OK)

    def post(self, request, course_id):
        course = get_object_or_404(Course, id=course_id)
        if not _can_manage(request.user, course):
            return Response({"error": "You do not own this course.", "code": "NOT_COURSE_INSTRUCTOR"}, status=status.HTTP_403_FORBIDDEN)

        serializer = QuizCreateSerializer(data=request.data, context={'course': course})
        if serializer.is_valid():
            quiz = serializer.save(course=course)
            return Response(QuizCreateSerializer(quiz).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class QuizManageView(APIView):
    """
    GET, PATCH, DELETE /api/v1/quizzes/{id}/manage/  (course instructor/admin)
    """
    permission_classes = [IsAuthenticated, IsCourseOwnerOrAdmin]

    def get(self, request, id):
        quiz = get_object_or_404(Quiz.objects.prefetch_related('questions__options'), id=id)
        self.check_object_permissions(request, quiz.course)
        return Response(QuizCreateSerializer(quiz).data, status=status.HTTP_200_OK)

    def patch(self, request, id):
        quiz = get_object_or_404(Quiz, id=id)
        self.check_object_permissions(request, quiz.course)

        serializer = QuizCreateSerializer(quiz, data=request.data, partial=True, context={'course': quiz.course})
        if serializer.is_valid():
            updated = serializer.save()
            return Response(QuizCreateSerializer(updated).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id):
        quiz = get_object_or_404(Quiz, id=id)
        self.check_object_permissions(request, quiz.course)
        if quiz.attempts.exists():
            # Deleting would cascade away students' attempt history; archive instead.
            return Response(
                {"error": "This quiz has student attempts. Archive it instead of deleting it.", "code": "HAS_ATTEMPTS"},
                status=status.HTTP_400_BAD_REQUEST
            )
        quiz.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class QuizQuestionsCreateView(APIView):
    """
    POST /api/v1/quizzes/{id}/questions/  (course instructor/admin)
    """
    permission_classes = [IsAuthenticated, IsCourseOwnerOrAdmin]

    def post(self, request, id):
        quiz = get_object_or_404(Quiz, id=id)
        self.check_object_permissions(request, quiz.course)

        data = request.data.copy()
        if 'position' not in data and 'order' not in data:
            data['position'] = (quiz.questions.aggregate(Max('position'))['position__max'] or 0) + 1

        serializer = QuestionCreateSerializer(data=data, context={'quiz': quiz})
        if serializer.is_valid():
            with transaction.atomic():
                question = serializer.save(quiz=quiz)
            return Response(QuestionReviewSerializer(question).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class QuestionManageView(APIView):
    """
    PATCH, DELETE /api/v1/questions/{id}/  (course instructor/admin)
    """
    permission_classes = [IsAuthenticated, IsCourseOwnerOrAdmin]

    def patch(self, request, id):
        question = get_object_or_404(Question.objects.select_related('quiz__course'), id=id)
        self.check_object_permissions(request, question.quiz.course)

        serializer = QuestionCreateSerializer(question, data=request.data, partial=True, context={'quiz': question.quiz})
        if serializer.is_valid():
            with transaction.atomic():
                updated = serializer.save()
            return Response(QuestionReviewSerializer(updated).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id):
        question = get_object_or_404(Question.objects.select_related('quiz__course'), id=id)
        self.check_object_permissions(request, question.quiz.course)
        if question.student_answers.exists():
            return Response(
                {"error": "Students have answered this question, so it cannot be deleted.", "code": "HAS_ANSWERS"},
                status=status.HTTP_400_BAD_REQUEST
            )
        question.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
