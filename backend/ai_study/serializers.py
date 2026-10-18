from rest_framework import serializers

from .models import StudyResource
from .validators import FLASHCARDS_MAX_CARDS, MCQ_MAX_QUESTIONS


class StudyResourceSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(source='lesson.title', read_only=True, default=None)
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = StudyResource
        fields = [
            'id', 'course', 'course_title', 'lesson', 'lesson_title', 'created_by',
            'resource_type', 'status', 'content', 'converted_quiz',
            'created_at', 'updated_at', 'published_at',
        ]
        read_only_fields = fields


class GenerateRequestSerializer(serializers.Serializer):
    resource_type = serializers.ChoiceField(choices=StudyResource.LESSON_TYPES)
    count = serializers.IntegerField(required=False, min_value=1)

    def validate(self, attrs):
        limit = {
            StudyResource.TYPE_MCQ: MCQ_MAX_QUESTIONS,
            StudyResource.TYPE_FLASHCARDS: FLASHCARDS_MAX_CARDS,
        }.get(attrs['resource_type'])
        count = attrs.get('count')
        if count is not None and limit is None:
            raise serializers.ValidationError({'count': 'count is only used for MCQ and FLASHCARDS.'})
        if count is not None and count > limit:
            raise serializers.ValidationError({'count': f'must be at most {limit}.'})
        return attrs


class StudyResourceUpdateSerializer(serializers.Serializer):
    content = serializers.JSONField()
