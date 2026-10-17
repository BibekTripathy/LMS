from django.contrib import admin
from .models import AIResource

@admin.register(AIResource)
class AIResourceAdmin(admin.ModelAdmin):
    list_display = ('resource_type', 'lesson', 'student', 'generated_at')
    list_filter = ('resource_type', 'generated_at')
    search_fields = ('lesson__title', 'student__email')
    readonly_fields = ('id', 'generated_at')
