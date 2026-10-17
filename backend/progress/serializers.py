from rest_framework import serializers
from .models import LessonProgress


class LessonProgressSerializer(serializers.ModelSerializer):
    lesson_id = serializers.UUIDField(source='lesson.id', read_only=True)
    enrollment_id = serializers.UUIDField(source='enrollment.id', read_only=True)
    timestamp = serializers.IntegerField(source='last_position_seconds', read_only=True)
    is_completed = serializers.BooleanField(source='completed', read_only=True)

    class Meta:
        model = LessonProgress
        fields = [
            'id',
            'enrollment_id',
            'lesson_id',
            'last_position_seconds',
            'timestamp',
            'completed',
            'is_completed',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'enrollment_id', 'lesson_id', 'created_at', 'updated_at']


class LessonProgressUpdateSerializer(serializers.Serializer):
    last_position_seconds = serializers.IntegerField(required=False, min_value=0)
    timestamp = serializers.IntegerField(required=False, min_value=0)
    completed = serializers.BooleanField(required=False)
    is_completed = serializers.BooleanField(required=False)

    def validate(self, attrs):
        # Support aliases
        if 'last_position_seconds' not in attrs and 'timestamp' in attrs:
            attrs['last_position_seconds'] = attrs['timestamp']
        if 'completed' not in attrs and 'is_completed' in attrs:
            attrs['completed'] = attrs['is_completed']

        if 'last_position_seconds' in attrs and attrs['last_position_seconds'] < 0:
            raise serializers.ValidationError({
                'last_position_seconds': 'Playback position cannot be negative.'
            })

        return attrs


class CourseLessonProgressItemSerializer(serializers.Serializer):
    lesson_id = serializers.UUIDField()
    title = serializers.CharField()
    order = serializers.IntegerField()
    is_required = serializers.BooleanField()
    completed = serializers.BooleanField()
    last_position_seconds = serializers.IntegerField()


class CourseProgressSerializer(serializers.Serializer):
    course_id = serializers.UUIDField()
    course_title = serializers.CharField()
    total_lessons = serializers.IntegerField()
    completed_lessons = serializers.IntegerField()
    progress_percentage = serializers.FloatField()
    is_completed = serializers.BooleanField()
    last_accessed_lesson_id = serializers.UUIDField(allow_null=True)
    lessons = CourseLessonProgressItemSerializer(many=True, required=False)
