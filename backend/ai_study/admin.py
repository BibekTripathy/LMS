from django.contrib import admin
from .models import StudyResource


@admin.register(StudyResource)
class StudyResourceAdmin(admin.ModelAdmin):
    list_display = ('resource_type', 'status', 'course', 'lesson', 'created_by', 'created_at')
    list_filter = ('resource_type', 'status', 'created_at')
    search_fields = ('lesson__title', 'course__title', 'created_by__email')
    readonly_fields = ('id', 'created_at', 'updated_at', 'published_at')
