from rest_framework import serializers
from .models import Enrollment
from courses.serializers import CourseSerializer

class EnrollmentSerializer(serializers.ModelSerializer):
    student_email = serializers.EmailField(source='student.email', read_only=True)
    student_name = serializers.SerializerMethodField()
    course_detail = CourseSerializer(source='course', read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            'id', 'student', 'student_email', 'student_name',
            'course', 'course_detail', 'enrolled_at', 'status'
        ]
        read_only_fields = ['id', 'student', 'enrolled_at']

    def get_student_name(self, obj):
        name = f"{obj.student.first_name} {obj.student.last_name}".strip()
        return name if name else obj.student.email
