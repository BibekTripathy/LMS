from django.urls import path
from .views import (
    QuizDetailView,
    QuizStartView,
    QuizSubmitView,
    QuizResultsMeView,
    AttemptDetailView,
    AttemptAnswersView,
    AttemptSubmitView
)

urlpatterns = [
    path('quizzes/<uuid:id>/', QuizDetailView.as_view(), name='quiz-detail'),
    path('quizzes/<uuid:id>/start/', QuizStartView.as_view(), name='quiz-start'),
    path('quizzes/<uuid:id>/submit/', QuizSubmitView.as_view(), name='quiz-submit'),
    path('quizzes/<uuid:id>/results/me/', QuizResultsMeView.as_view(), name='quiz-results-me'),
    path('attempts/<uuid:id>/', AttemptDetailView.as_view(), name='attempt-detail'),
    path('attempts/<uuid:id>/answers/', AttemptAnswersView.as_view(), name='attempt-answers'),
    path('attempts/<uuid:id>/submit/', AttemptSubmitView.as_view(), name='attempt-submit'),
]
