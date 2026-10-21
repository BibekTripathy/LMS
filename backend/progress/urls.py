from django.urls import path
from .views import (
    LessonProgressView,
    LessonCompleteView,
    CourseProgressView
)

urlpatterns = [
    path('lessons/<uuid:id>/progress/', LessonProgressView.as_view(), name='lesson-progress'),
    path('lessons/<uuid:id>/complete/', LessonCompleteView.as_view(), name='lesson-complete'),
    path('courses/<uuid:id>/progress/', CourseProgressView.as_view(), name='course-progress'),
]
