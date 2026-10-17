from rest_framework import serializers
from .models import AIResource

class AIResourceSerializer(serializers.ModelSerializer):
    student_email = serializers.EmailField(source='student.email', read_only=True)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    course_id = serializers.UUIDField(source='lesson.module.course.id', read_only=True)
    course_title = serializers.CharField(source='lesson.module.course.title', read_only=True)

    class Meta:
        model = AIResource
        fields = [
            'id',
            'student',
            'student_email',
            'lesson',
            'lesson_title',
            'course_id',
            'course_title',
            'resource_type',
            'content',
            'generated_at',
        ]
        read_only_fields = ['id', 'student', 'generated_at']


class GenerateAIResourceRequestSerializer(serializers.Serializer):
    lesson_id = serializers.UUIDField(required=True)
