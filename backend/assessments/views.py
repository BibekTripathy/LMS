from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Quiz, Question, QuizAttempt
from .permissions import CanAccessQuiz, IsAttemptStudent
from courses.models import Course
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
        return Response(serializer.data, status=status.HTTP_201_CREATED)


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

        attempt_id = request.data.get('attempt_id')
        if not attempt_id:
            return Response(
                {"error": "attempt_id is required in request payload"},
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


class CourseQuizListView(APIView):
    """
    GET /api/v1/courses/{course_id}/quizzes/
    POST /api/v1/courses/{course_id}/quizzes/
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsInstructorOrAdmin()]
        return [IsAuthenticated()]

    def get(self, request, course_id):
        course = get_object_or_404(Course, id=course_id)
        is_instructor = request.user.role in ['INSTRUCTOR', 'ADMIN'] or course.instructor == request.user
        
        quizzes = course.quizzes.all().prefetch_related('questions__options')
        if not is_instructor:
            quizzes = quizzes.filter(status='PUBLISHED')

        if is_instructor:
            return Response(QuizCreateSerializer(quizzes, many=True).data, status=status.HTTP_200_OK)
        return Response(QuizDetailSerializer(quizzes, many=True).data, status=status.HTTP_200_OK)

    def post(self, request, course_id):
        course = get_object_or_404(Course, id=course_id)
        if course.instructor != request.user and request.user.role != 'ADMIN':
            return Response({"error": "You do not own this course."}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        data['course'] = str(course.id)
        serializer = QuizCreateSerializer(data=data)
        if serializer.is_valid():
            quiz = serializer.save(course=course)
            return Response(QuizCreateSerializer(quiz).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class QuizManageView(APIView):
    """
    GET, PATCH, DELETE /api/v1/quizzes/{id}/manage/ and /api/v1/quizzes/{id}/
    """
    permission_classes = [IsAuthenticated, IsCourseOwnerOrAdmin]

    def get(self, request, id):
        quiz = get_object_or_404(Quiz.objects.prefetch_related('questions__options'), id=id)
        self.check_object_permissions(request, quiz.course)
        return Response(QuizCreateSerializer(quiz).data, status=status.HTTP_200_OK)

    def patch(self, request, id):
        quiz = get_object_or_404(Quiz, id=id)
        self.check_object_permissions(request, quiz.course)

        serializer = QuizCreateSerializer(quiz, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response(QuizCreateSerializer(updated).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id):
        quiz = get_object_or_404(Quiz, id=id)
        self.check_object_permissions(request, quiz.course)
        quiz.delete()
        return Response({"message": "Quiz deleted successfully"}, status=status.HTTP_204_NO_CONTENT)


class QuizQuestionsCreateView(APIView):
    """
    POST /api/v1/quizzes/{id}/questions/
    """
    permission_classes = [IsAuthenticated, IsCourseOwnerOrAdmin]

    def post(self, request, id):
        quiz = get_object_or_404(Quiz, id=id)
        self.check_object_permissions(request, quiz.course)

        data = request.data.copy()
        if 'position' not in data and 'order' not in data:
            data['position'] = quiz.questions.count() + 1

        serializer = QuestionCreateSerializer(data=data)
        if serializer.is_valid():
            question = serializer.save(quiz=quiz)
            return Response(QuestionReviewSerializer(question).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class QuestionManageView(APIView):
    """
    PATCH, DELETE /api/v1/questions/{id}/
    """
    permission_classes = [IsAuthenticated, IsCourseOwnerOrAdmin]

    def patch(self, request, id):
        question = get_object_or_404(Question.objects.select_related('quiz__course'), id=id)
        self.check_object_permissions(request, question.quiz.course)

        serializer = QuestionCreateSerializer(question, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response(QuestionReviewSerializer(updated).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id):
        question = get_object_or_404(Question.objects.select_related('quiz__course'), id=id)
        self.check_object_permissions(request, question.quiz.course)
        question.delete()
        return Response({"message": "Question deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

