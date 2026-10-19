import uuid
from django.db import models
from django.conf import settings


class Certificate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='certificates'
    )
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='certificates'
    )
    verification_code = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="Unique verification code for public certificate verification."
    )
    issued_at = models.DateTimeField(auto_now_add=True)
    certificate_url = models.URLField(blank=True, null=True)

    class Meta:
        ordering = ['-issued_at']
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'course'],
                name='unique_student_course_certificate'
            )
        ]

    def __str__(self):
        return f"Certificate {self.verification_code} - {self.student.email} ({self.course.title})"

    @property
    def student_name(self):
        if self.student:
            full_name = f"{self.student.first_name} {self.student.last_name}".strip()
            return full_name or self.student.email
        return ""

    @property
    def course_title(self):
        return self.course.title if self.course else ""

    @property
    def instructor_name(self):
        if self.course and self.course.instructor:
            inst = self.course.instructor
            full_name = f"{inst.first_name} {inst.last_name}".strip()
            return full_name or inst.email
        return ""
