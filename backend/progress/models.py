import uuid
from django.db import models
from django.core.exceptions import ValidationError


class LessonProgress(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    enrollment = models.ForeignKey(
        'enrollments.Enrollment',
        on_delete=models.CASCADE,
        related_name='lesson_progresses'
    )
    lesson = models.ForeignKey(
        'courses.Lesson',
        on_delete=models.CASCADE,
        related_name='progresses'
    )
    last_position_seconds = models.PositiveIntegerField(default=0)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        constraints = [
            models.UniqueConstraint(
                fields=['enrollment', 'lesson'],
                name='unique_enrollment_lesson_progress'
            )
        ]

    def __str__(self):
        status = "Completed" if self.completed else "In Progress"
        return f"{self.enrollment.student.email} - {self.lesson.title}: {self.last_position_seconds}s ({status})"

    @property
    def student(self):
        return self.enrollment.student

    @property
    def course(self):
        return self.enrollment.course

    @property
    def is_completed(self):
        return self.completed

    @property
    def timestamp(self):
        return self.last_position_seconds

    def clean(self):
        super().clean()
        if self.last_position_seconds < 0:
            raise ValidationError({'last_position_seconds': 'Playback position cannot be negative.'})

        # Validate that the lesson belongs to the enrolled course
        if hasattr(self, 'lesson') and hasattr(self, 'enrollment'):
            lesson_course = getattr(self.lesson.module, 'course', None) if hasattr(self.lesson, 'module') else None
            enrollment_course = getattr(self.enrollment, 'course', None)
            if lesson_course and enrollment_course and lesson_course != enrollment_course:
                raise ValidationError('The lesson does not belong to the enrolled course.')
