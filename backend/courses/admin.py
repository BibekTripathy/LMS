from django.contrib import admin
from .models import Course, Module, Lesson

class ModuleInline(admin.TabularInline):
    model = Module
    extra = 1
    fields = ('order', 'title', 'description')

class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 1
    fields = ('order', 'title', 'video_url', 'is_required')

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'instructor', 'category', 'difficulty', 'is_published', 'status', 'created_at')
    list_filter = ('is_published', 'status', 'difficulty', 'category')
    search_fields = ('title', 'description', 'instructor__email')
    inlines = [ModuleInline]

@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order', 'created_at')
    list_filter = ('course',)
    search_fields = ('title', 'course__title')
    inlines = [LessonInline]

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'module', 'order', 'is_required', 'created_at')
    list_filter = ('is_required', 'module__course')
    search_fields = ('title', 'content', 'transcript', 'module__title', 'module__course__title')
