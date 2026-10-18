from django.contrib import admin
from .models import LessonProgress


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ('id', 'student_email', 'lesson_title', 'last_position_seconds', 'completed', 'updated_at')
    list_filter = ('completed', 'updated_at')
    search_fields = ('enrollment__student__email', 'lesson__title')

    def student_email(self, obj):
        return obj.enrollment.student.email

    def lesson_title(self, obj):
        return obj.lesson.title
