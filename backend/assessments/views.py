from django.shortcuts import get_object_or_404
from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Quiz, QuizAttempt
from .permissions import CanAccessQuiz, IsAttemptStudent
from .serializers import (
    QuizDetailSerializer,
    QuizAttemptSerializer,
    QuizAttemptDetailSerializer,
    QuizResultsMeSerializer
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
