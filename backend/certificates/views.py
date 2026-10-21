from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError

from courses.models import Course
from .models import Certificate
from .services import (
    issue_certificate,
    get_student_certificates,
    verify_certificate,
    check_course_completion,
)
from .serializers import (
    CertificateSerializer,
    PublicCertificateVerifySerializer,
)


class MyCertificatesView(APIView):
    """
    GET /api/v1/certificates/me/
    Retrieves all certificates earned by the authenticated student.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        certificates = get_student_certificates(request.user)
        serializer = CertificateSerializer(certificates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CertificateVerifyView(APIView):
    """
    GET /api/v1/certificates/verify/{code}/
    Public endpoint that returns limited verification information for a certificate.
    Does not expose sensitive personal information.
    """
    permission_classes = [AllowAny]

    def get(self, request, code):
        certificate = verify_certificate(code)
        if not certificate:
            return Response(
                {
                    "error": "Certificate not found or invalid verification code.",
                    "code": "CERTIFICATE_NOT_FOUND",
                    "valid": False,
                },
                status=status.HTTP_404_NOT_FOUND
            )

        data = {
            'valid': True,
            'verification_code': certificate.verification_code,
            'course_title': certificate.course_title,
            'student_name': certificate.student_name,
            'instructor_name': certificate.instructor_name,
            'issued_at': certificate.issued_at,
        }
        serializer = PublicCertificateVerifySerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CourseCertificateView(APIView):
    """
    GET & POST /api/v1/courses/{id}/certificate/
    Checks completion criteria and retrieves or issues the certificate
    for the authenticated student in the specified course.
    """
    permission_classes = [IsAuthenticated]

    def get_course(self, course_id):
        return get_object_or_404(Course, id=course_id)

    def get(self, request, id):
        course = self.get_course(id)

        # Check if already issued
        existing = Certificate.objects.filter(student=request.user, course=course).first()
        if existing:
            serializer = CertificateSerializer(existing)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Check eligibility and issue if eligible
        eligible, details = check_course_completion(request.user, course)
        if not eligible:
            return Response(
                {
                    "error": "Course completion criteria have not been satisfied.",
                    "code": "CRITERIA_NOT_MET",
                    "details": details,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        certificate, created = issue_certificate(request.user, course)
        serializer = CertificateSerializer(certificate)
        code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=code)

    def post(self, request, id):
        course = self.get_course(id)
        try:
            certificate, created = issue_certificate(request.user, course)
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

        serializer = CertificateSerializer(certificate)
        code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=code)
