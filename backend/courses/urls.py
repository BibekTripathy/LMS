from django.urls import path
from .views import (
    CourseListCreateView,
    CourseDetailView,
    CoursePublishView,
    CourseArchiveView,
    CourseModulesView,
    ModuleDetailView,
    ModuleLessonsView,
    LessonDetailView
)

urlpatterns = [
    path('courses/', CourseListCreateView.as_view(), name='course-list-create'),
    path('courses/<uuid:id>/', CourseDetailView.as_view(), name='course-detail'),
    path('courses/<uuid:id>/publish/', CoursePublishView.as_view(), name='course-publish'),
    path('courses/<uuid:id>/archive/', CourseArchiveView.as_view(), name='course-archive'),
    path('courses/<uuid:id>/modules/', CourseModulesView.as_view(), name='course-modules'),
    path('modules/<uuid:id>/', ModuleDetailView.as_view(), name='module-detail'),
    path('modules/<uuid:id>/lessons/', ModuleLessonsView.as_view(), name='module-lessons'),
    path('lessons/<uuid:id>/', LessonDetailView.as_view(), name='lesson-detail'),
]
