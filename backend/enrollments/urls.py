from django.urls import path
from .views import CourseEnrollView, MyEnrollmentsView, CourseStudentsView

urlpatterns = [
    path('courses/<uuid:id>/enroll/', CourseEnrollView.as_view(), name='course-enroll'),
    path('enrollments/me/', MyEnrollmentsView.as_view(), name='my-enrollments'),
    path('courses/<uuid:id>/students/', CourseStudentsView.as_view(), name='course-students'),
]
