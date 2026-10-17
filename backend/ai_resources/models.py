import uuid
from django.db import models
from django.conf import settings

class AIResource(models.Model):
    RESOURCE_TYPES = (
        ('SUMMARY', 'Summary'),
        ('FLASHCARDS', 'Flashcards'),
        ('MCQ_REVISION', 'MCQ Revision'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_resources'
    )
    lesson = models.ForeignKey(
        'courses.Lesson',
        on_delete=models.CASCADE,
        related_name='ai_resources'
    )
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPES)
    content = models.JSONField()
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-generated_at']

    def __str__(self):
        return f"{self.resource_type} for {self.lesson.title} ({self.student.email})"
