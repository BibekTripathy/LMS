from django.urls import path
from .views import (
    QuizDetailView,
    QuizStartView,
    QuizSubmitView,
    QuizResultsMeView,
    AttemptDetailView,
    AttemptAnswersView,
    AttemptSubmitView,
    CourseQuizListView,
    QuizManageView,
    QuizQuestionsCreateView,
    QuestionManageView,
)

urlpatterns = [
    path('courses/<uuid:course_id>/quizzes/', CourseQuizListView.as_view(), name='course-quizzes'),
    path('quizzes/<uuid:id>/', QuizDetailView.as_view(), name='quiz-detail'),
    path('quizzes/<uuid:id>/manage/', QuizManageView.as_view(), name='quiz-manage'),
    path('quizzes/<uuid:id>/start/', QuizStartView.as_view(), name='quiz-start'),
    path('quizzes/<uuid:id>/submit/', QuizSubmitView.as_view(), name='quiz-submit'),
    path('quizzes/<uuid:id>/results/me/', QuizResultsMeView.as_view(), name='quiz-results-me'),
    path('quizzes/<uuid:id>/questions/', QuizQuestionsCreateView.as_view(), name='quiz-questions-create'),
    path('questions/<uuid:id>/', QuestionManageView.as_view(), name='question-manage'),
    path('attempts/<uuid:id>/', AttemptDetailView.as_view(), name='attempt-detail'),
    path('attempts/<uuid:id>/answers/', AttemptAnswersView.as_view(), name='attempt-answers'),
    path('attempts/<uuid:id>/submit/', AttemptSubmitView.as_view(), name='attempt-submit'),
]

