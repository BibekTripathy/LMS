import uuid
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q


class StudyResource(models.Model):
    TYPE_MCQ = 'MCQ'
    TYPE_FLASHCARDS = 'FLASHCARDS'
    TYPE_SUMMARY = 'SUMMARY'
    TYPE_REVISION = 'REVISION'
    RESOURCE_TYPE_CHOICES = (
        (TYPE_MCQ, 'Multiple-choice questions'),
        (TYPE_FLASHCARDS, 'Flashcards'),
        (TYPE_SUMMARY, 'Summary'),
        (TYPE_REVISION, 'Personalised revision'),
    )
    LESSON_TYPES = (TYPE_MCQ, TYPE_FLASHCARDS, TYPE_SUMMARY)

    STATUS_DRAFT = 'DRAFT'
    STATUS_PUBLISHED = 'PUBLISHED'
    STATUS_CHOICES = (
        (STATUS_DRAFT, 'Draft'),
        (STATUS_PUBLISHED, 'Published'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Lesson resources (MCQ, flashcards, summary) belong to a lesson; a personalised
    # revision spans the whole course, so it has a course but no lesson.
    lesson = models.ForeignKey(
        'courses.Lesson',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='study_resources'
    )
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='study_resources'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='study_resources'
    )
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPE_CHOICES)
    content = models.JSONField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    converted_quiz = models.ForeignKey(
        'assessments.Quiz',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='source_study_resources'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.CheckConstraint(
                condition=Q(resource_type='REVISION') | Q(lesson__isnull=False),
                name='study_resource_lesson_required_unless_revision'
            ),
        ]
        indexes = [
            models.Index(fields=['lesson', 'status'], name='study_res_lesson_status_idx'),
            models.Index(fields=['course', 'created_by', 'resource_type'], name='study_res_owner_type_idx'),
        ]

    def __str__(self):
        return f"{self.resource_type} ({self.status}) for {self.lesson or self.course}"

    @property
    def is_revision(self):
        return self.resource_type == self.TYPE_REVISION

    def clean(self):
        super().clean()
        if self.lesson_id and self.course_id and self.lesson.module.course_id != self.course_id:
            raise ValidationError({'lesson': 'The lesson does not belong to this course.'})
