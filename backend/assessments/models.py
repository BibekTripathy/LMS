import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError


class Quiz(models.Model):
    STATUS_CHOICES = (
        ('DRAFT', 'Draft'),
        ('PUBLISHED', 'Published'),
        ('ARCHIVED', 'Archived'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='quizzes'
    )
    lesson = models.ForeignKey(
        'courses.Lesson',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quizzes'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    time_limit_seconds = models.PositiveIntegerField(
        default=1800,
        help_text="Time limit in seconds. 0 indicates no time limit."
    )
    pass_percentage = models.PositiveIntegerField(
        default=70,
        help_text="Passing score percentage threshold (0-100)."
    )
    max_attempts = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Maximum finished (submitted or expired) attempts per student. Empty means unlimited."
    )
    leaderboard_enabled = models.BooleanField(
        default=True,
        help_text="Whether enrolled students can see the quiz leaderboard."
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.course.title})"

    @property
    def passing_score_percentage(self):
        return self.pass_percentage

    @property
    def total_marks(self):
        return sum(q.marks for q in self.questions.all())

    @property
    def total_questions(self):
        return self.questions.count()

    def clean(self):
        super().clean()
        if self.pass_percentage > 100:
            raise ValidationError({'pass_percentage': 'Passing percentage cannot exceed 100.'})
        if self.lesson and hasattr(self.lesson, 'module') and hasattr(self.lesson.module, 'course'):
            if self.course_id and self.lesson.module.course_id != self.course_id:
                raise ValidationError({'lesson': 'The selected lesson does not belong to the selected course.'})

    def save(self, *args, **kwargs):
        if self.lesson and not self.course_id and hasattr(self.lesson, 'module') and hasattr(self.lesson.module, 'course'):
            self.course = self.lesson.module.course
        self.full_clean()
        super().save(*args, **kwargs)


class Question(models.Model):
    QUESTION_TYPE_CHOICES = (
        ('MCQ', 'Multiple Choice'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='questions'
    )
    prompt = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES, default='MCQ')
    marks = models.PositiveIntegerField(default=1)
    explanation = models.TextField(blank=True, default='')
    position = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['position', 'created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['quiz', 'position'],
                name='unique_quiz_question_position'
            )
        ]

    def __str__(self):
        return f"Q{self.position}: {self.prompt[:50]}"

    @property
    def text(self):
        return self.prompt

    @property
    def order(self):
        return self.position


class QuestionOption(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='options'
    )
    text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)
    position = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['position', 'created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['question', 'position'],
                name='unique_question_option_position'
            )
        ]

    def __str__(self):
        return f"Option {self.position} for Q{self.question.position}: {self.text[:30]}"

    @property
    def order(self):
        return self.position


class QuizAttempt(models.Model):
    STATUS_CHOICES = (
        ('IN_PROGRESS', 'In Progress'),
        ('SUBMITTED', 'Submitted'),
        ('EXPIRED', 'Expired'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='attempts'
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='quiz_attempts'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='IN_PROGRESS')
    started_at = models.DateTimeField(default=timezone.now)
    deadline_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    score = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    marks_obtained = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    total_marks_possible = models.PositiveIntegerField(default=0)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    passed = models.BooleanField(null=True, blank=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"Attempt {self.id} by {self.student.email} on {self.quiz.title} ({self.status})"

    @property
    def start_time(self):
        return self.started_at

    @property
    def completed_at(self):
        return self.submitted_at

    def is_expired(self):
        if self.status == 'EXPIRED':
            return True
        if self.deadline_at and timezone.now() > self.deadline_at:
            return True
        return False


class Answer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attempt = models.ForeignKey(
        QuizAttempt,
        on_delete=models.CASCADE,
        related_name='answers'
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='student_answers'
    )
    selected_option = models.ForeignKey(
        QuestionOption,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='selected_answers'
    )
    is_correct = models.BooleanField(default=False)
    marks_awarded = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['attempt', 'question'],
                name='unique_attempt_question_answer'
            )
        ]

    def __str__(self):
        return f"Answer for Q{self.question.position} in Attempt {self.attempt_id}"

    @property
    def selected_choice(self):
        return self.selected_option

    def clean(self):
        super().clean()
        if hasattr(self, 'question') and hasattr(self, 'attempt'):
            if self.question.quiz_id != self.attempt.quiz_id:
                raise ValidationError("The question does not belong to the attempt's quiz.")
        if self.selected_option and hasattr(self, 'question'):
            if self.selected_option.question_id != self.question_id:
                raise ValidationError("The selected option does not belong to the question.")
