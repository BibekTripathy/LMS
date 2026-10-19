from rest_framework import serializers
from .models import Certificate


class CertificateSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(read_only=True)
    course_title = serializers.CharField(read_only=True)
    instructor_name = serializers.CharField(read_only=True)

    class Meta:
        model = Certificate
        fields = [
            'id',
            'student',
            'student_name',
            'course',
            'course_title',
            'instructor_name',
            'verification_code',
            'issued_at',
            'certificate_url',
        ]
        read_only_fields = fields


class PublicCertificateVerifySerializer(serializers.Serializer):
    """
    Public verification response schema with strictly limited information.
    Excludes sensitive student details (email, user ID, internal course IDs).
    """
    valid = serializers.BooleanField(default=True)
    verification_code = serializers.CharField()
    course_title = serializers.CharField()
    student_name = serializers.CharField()
    instructor_name = serializers.CharField()
    issued_at = serializers.DateTimeField()
