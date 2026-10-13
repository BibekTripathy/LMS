from rest_framework import serializers
from .models import Course, Module, Lesson
from enrollments.models import Enrollment

class LessonSerializer(serializers.ModelSerializer):
    position = serializers.IntegerField(source='order', read_only=True)

    class Meta:
        model = Lesson
        fields = [
            'id', 'module', 'title', 'content', 'reading_content',
            'video_url', 'transcript', 'order', 'position', 'is_required',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_internal_value(self, data):
        if 'order' not in data and 'position' in data:
            data = data.copy()
            data['order'] = data['position']
        return super().to_internal_value(data)


class LessonSummarySerializer(serializers.ModelSerializer):
    position = serializers.IntegerField(source='order', read_only=True)
    video_url = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'video_url', 'order', 'position', 'is_required'
        ]

    def get_video_url(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return None
        user = request.user
        if user.role == 'ADMIN' or user.is_staff or user.is_superuser:
            return obj.video_url
        if hasattr(obj, 'module') and hasattr(obj.module, 'course'):
            course = obj.module.course
            if course.instructor == user:
                return obj.video_url
            user_enrolled_courses = self.context.get('user_enrolled_courses')
            if user_enrolled_courses is not None:
                return obj.video_url if course.id in user_enrolled_courses else None
            if Enrollment.objects.filter(student=user, course=course, status='ACTIVE').exists():
                return obj.video_url
        return None


class ModuleSerializer(serializers.ModelSerializer):
    position = serializers.IntegerField(source='order', read_only=True)
    lessons = LessonSummarySerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = [
            'id', 'course', 'title', 'description', 'order', 'position',
            'lessons', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_internal_value(self, data):
        if 'order' not in data and 'position' in data:
            data = data.copy()
            data['order'] = data['position']
        return super().to_internal_value(data)


class CourseSerializer(serializers.ModelSerializer):
    instructor_name = serializers.SerializerMethodField()
    modules_count = serializers.SerializerMethodField()
    lessons_count = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'instructor', 'instructor_name',
            'category', 'difficulty', 'thumbnail_url', 'is_published', 'status',
            'modules_count', 'lessons_count', 'is_enrolled',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'instructor', 'created_at', 'updated_at']

    def get_instructor_name(self, obj):
        name = f"{obj.instructor.first_name} {obj.instructor.last_name}".strip()
        return name if name else obj.instructor.email

    def get_modules_count(self, obj):
        if hasattr(obj, 'annotated_modules_count'):
            return obj.annotated_modules_count
        return obj.modules.count()

    def get_lessons_count(self, obj):
        if hasattr(obj, 'annotated_lessons_count'):
            return obj.annotated_lessons_count
        return Lesson.objects.filter(module__course=obj).count()

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            user_enrolled_courses = self.context.get('user_enrolled_courses')
            if user_enrolled_courses is not None:
                return obj.id in user_enrolled_courses
            return Enrollment.objects.filter(
                student=request.user,
                course=obj,
                status='ACTIVE'
            ).exists()
        return False


class CourseDetailSerializer(CourseSerializer):
    modules = ModuleSerializer(many=True, read_only=True)

    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ['modules']
