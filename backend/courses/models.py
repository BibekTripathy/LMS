import uuid
from django.db import models
from django.conf import settings

class Course(models.Model):
    DIFFICULTY_CHOICES = (
        ('BEGINNER', 'Beginner'),
        ('INTERMEDIATE', 'Intermediate'),
        ('ADVANCED', 'Advanced'),
    )
    STATUS_CHOICES = (
        ('DRAFT', 'Draft'),
        ('PUBLISHED', 'Published'),
        ('ARCHIVED', 'Archived'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='courses'
    )
    category = models.CharField(max_length=100, blank=True, default='')
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='BEGINNER')
    thumbnail_url = models.URLField(blank=True, null=True)
    is_published = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Keep is_published and status synchronized
        if self.is_published and self.status == 'DRAFT':
            self.status = 'PUBLISHED'
        elif self.status == 'PUBLISHED':
            self.is_published = True
        elif self.status in ['DRAFT', 'ARCHIVED']:
            self.is_published = False
        super().save(*args, **kwargs)


class Module(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='modules'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    order = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['course', 'order'],
                name='unique_course_module_order'
            )
        ]

    def __str__(self):
        return f"{self.course.title} - Module {self.order}: {self.title}"

    @property
    def position(self):
        return self.order

    @position.setter
    def position(self, value):
        self.order = value


class Lesson(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.ForeignKey(
        Module,
        on_delete=models.CASCADE,
        related_name='lessons'
    )
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True, default='')
    reading_content = models.TextField(blank=True, default='')
    video_url = models.URLField(blank=True, null=True)
    transcript = models.TextField(blank=True, default='')
    order = models.PositiveIntegerField(default=1)
    is_required = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['module', 'order'],
                name='unique_module_lesson_order'
            )
        ]

    def __str__(self):
        return f"{self.module.title} - Lesson {self.order}: {self.title}"

    @property
    def position(self):
        return self.order

    @position.setter
    def position(self, value):
        self.order = value

    def save(self, *args, **kwargs):
        # Keep content and reading_content in sync for convenience
        if self.content and not self.reading_content:
            self.reading_content = self.content
        elif self.reading_content and not self.content:
            self.content = self.reading_content
        super().save(*args, **kwargs)
