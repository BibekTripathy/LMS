from django.urls import path
from .views import (
    MyCertificatesView,
    CertificateVerifyView,
    CourseCertificateView,
)

urlpatterns = [
    path('certificates/me/', MyCertificatesView.as_view(), name='my-certificates'),
    path('certificates/verify/<str:code>/', CertificateVerifyView.as_view(), name='certificate-verify'),
    path('courses/<uuid:id>/certificate/', CourseCertificateView.as_view(), name='course-certificate'),
]
