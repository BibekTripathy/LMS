from django.urls import path
from .views import (
    CourseRevisionView,
    LessonGenerateView,
    LessonResourceListView,
    StudyResourceConvertView,
    StudyResourceDetailView,
    StudyResourcePublishView,
)

urlpatterns = [
    path('lessons/<uuid:id>/ai/generate/', LessonGenerateView.as_view(), name='ai-lesson-generate'),
    path('lessons/<uuid:id>/resources/', LessonResourceListView.as_view(), name='ai-lesson-resources'),
    path('resources/<uuid:id>/', StudyResourceDetailView.as_view(), name='ai-resource-detail'),
    path('resources/<uuid:id>/publish/', StudyResourcePublishView.as_view(), name='ai-resource-publish'),
    path('resources/<uuid:id>/convert-to-quiz/', StudyResourceConvertView.as_view(), name='ai-resource-convert'),
    path('courses/<uuid:id>/ai/revisions/', CourseRevisionView.as_view(), name='ai-course-revisions'),
]
