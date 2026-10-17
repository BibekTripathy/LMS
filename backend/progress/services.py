from rest_framework.exceptions import PermissionDenied, ValidationError
from enrollments.models import Enrollment
from courses.models import Lesson, Course
from .models import LessonProgress


def get_active_enrollment(user, course):
    """
    Retrieves the active enrollment for a user and course.
    Raises PermissionDenied if the user is not actively enrolled.
    """
    enrollment = Enrollment.objects.filter(
        student=user,
        course=course,
        status='ACTIVE'
    ).first()
    if not enrollment:
        raise PermissionDenied("You must have an active enrollment in this course.")
    return enrollment


def get_or_create_lesson_progress(user, lesson):
    """
    Retrieves or initializes a student's progress for a specific lesson in PostgreSQL.
    Enforces active course enrollment.
    """
    if not hasattr(lesson, 'module') or not hasattr(lesson.module, 'course'):
        raise ValidationError("Lesson does not have an associated course.")

    course = lesson.module.course
    enrollment = get_active_enrollment(user, course)

    progress, _ = LessonProgress.objects.get_or_create(
        enrollment=enrollment,
        lesson=lesson,
        defaults={
            'last_position_seconds': 0,
            'completed': False
        }
    )
    return progress


def update_lesson_progress(user, lesson, last_position_seconds=None, completed=None):
    """
    Updates the playback position and/or completion status of a lesson.
    Persists updates directly to PostgreSQL.
    """
    progress = get_or_create_lesson_progress(user, lesson)

    if last_position_seconds is not None:
        if last_position_seconds < 0:
            raise ValidationError({'last_position_seconds': 'Playback position cannot be negative.'})
        progress.last_position_seconds = last_position_seconds

    if completed is not None:
        progress.completed = completed

    progress.full_clean()
    progress.save()
    return progress


def mark_lesson_completed(user, lesson):
    """
    Marks a lesson as completed for the enrolled student.
    Persists the update directly to PostgreSQL.
    """
    return update_lesson_progress(user, lesson, completed=True)


def calculate_course_progress(user, course):
    """
    Calculates overall course progress for an enrolled student.
    Returns total lessons, completed count, percentage, and completion status.
    """
    enrollment = get_active_enrollment(user, course)

    lessons = Lesson.objects.filter(module__course=course).select_related('module').order_by('module__order', 'order')
    total_lessons = lessons.count()

    progresses = LessonProgress.objects.filter(enrollment=enrollment, lesson__in=lessons)
    progress_by_lesson_id = {p.lesson_id: p for p in progresses}

    completed_lessons = sum(1 for p in progresses if p.completed)
    progress_percentage = round((completed_lessons / total_lessons * 100), 2) if total_lessons > 0 else 0.0
    is_completed = (total_lessons > 0 and completed_lessons == total_lessons)

    latest_progress = progresses.order_by('-updated_at').first()
    first_lesson = lessons.first()
    last_accessed_lesson_id = latest_progress.lesson_id if latest_progress else (first_lesson.id if first_lesson else None)

    lessons_detail = [
        {
            'lesson_id': l.id,
            'title': l.title,
            'order': l.order,
            'is_required': l.is_required,
            'completed': progress_by_lesson_id[l.id].completed if l.id in progress_by_lesson_id else False,
            'last_position_seconds': progress_by_lesson_id[l.id].last_position_seconds if l.id in progress_by_lesson_id else 0,
        }
        for l in lessons
    ]

    return {
        'course_id': course.id,
        'course_title': course.title,
        'total_lessons': total_lessons,
        'completed_lessons': completed_lessons,
        'progress_percentage': progress_percentage,
        'is_completed': is_completed,
        'last_accessed_lesson_id': last_accessed_lesson_id,
        'lessons': lessons_detail,
    }
