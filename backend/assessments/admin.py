from django.contrib import admin
from .models import Quiz, Question, QuestionOption, QuizAttempt, Answer


class QuestionOptionInline(admin.TabularInline):
    model = QuestionOption
    extra = 4


class QuestionInline(admin.StackedInline):
    model = Question
    extra = 1


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'time_limit_seconds', 'pass_percentage', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('title', 'course__title')
    inlines = [QuestionInline]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('prompt_preview', 'quiz', 'position', 'marks')
    list_filter = ('quiz',)
    inlines = [QuestionOptionInline]

    def prompt_preview(self, obj):
        return obj.prompt[:50]


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ('id', 'quiz', 'student', 'status', 'score', 'percentage', 'passed', 'started_at', 'submitted_at')
    list_filter = ('status', 'passed', 'started_at')
    search_fields = ('student__email', 'quiz__title')


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ('id', 'attempt', 'question', 'selected_option', 'is_correct', 'marks_awarded')
    list_filter = ('is_correct',)
