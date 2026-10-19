from django.urls import path
from .views import (
    StudentAnalyticsView,
    CourseAnalyticsView,
    AdminAnalyticsView,
    QuizLeaderboardView,
)

urlpatterns = [
    path('analytics/student/', StudentAnalyticsView.as_view(), name='student-analytics'),
    path('courses/<uuid:id>/analytics/', CourseAnalyticsView.as_view(), name='course-analytics'),
    path('analytics/admin/', AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('quizzes/<uuid:id>/leaderboard/', QuizLeaderboardView.as_view(), name='quiz-leaderboard'),
]
