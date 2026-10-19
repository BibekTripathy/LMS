import uuid
from django.db import transaction
from django.db.models import Max
from rest_framework.exceptions import ValidationError

from enrollments.models import Enrollment
from courses.models import Lesson
from progress.models import LessonProgress
from assessments.models import Quiz, QuizAttempt
from .models import Certificate


def check_course_completion(user, course):
    """
    Evaluates whether a student has satisfied the explicit course completion criteria:
    1. Student must be enrolled in the course.
    2. All lessons (or all required lessons) in the course must be completed.
    3. Student must have passed all published quizzes in the course (highest attempt used).
    """
    enrollment = Enrollment.objects.filter(
        student=user,
        course=course
    ).exclude(status='DROPPED').first()

    if not enrollment:
        return False, {
            'reason': 'Not enrolled in this course.',
            'enrolled': False,
            'eligible': False,
        }

    lessons = Lesson.objects.filter(module__course=course)
    total_lessons = lessons.count()
    if total_lessons == 0:
        return False, {
            'reason': 'Course does not contain any lessons.',
            'total_lessons': 0,
            'completed_lessons': 0,
            'all_lessons_completed': False,
            'eligible': False,
        }

    progresses = LessonProgress.objects.filter(
        enrollment=enrollment,
        lesson__in=lessons,
        completed=True
    )
    completed_lesson_ids = set(progresses.values_list('lesson_id', flat=True))

    required_lessons = [l for l in lessons if l.is_required]
    target_lessons = required_lessons if required_lessons else list(lessons)
    target_ids = {l.id for l in target_lessons}

    all_lessons_completed = target_ids.issubset(completed_lesson_ids)

    # Check published quizzes in this course
    quizzes = Quiz.objects.filter(course=course, status='PUBLISHED')
    total_quizzes = quizzes.count()
    quizzes_passed_count = 0
    missing_quizzes = []

    for q in quizzes:
        # Check if the student has passed this quiz with any submitted attempt
        has_passed = QuizAttempt.objects.filter(
            quiz=q,
            student=user,
            status='SUBMITTED',
            passed=True
        ).exists()

        if not has_passed:
            # Also check if highest score / percentage reached the passing threshold
            best_pct = QuizAttempt.objects.filter(
                quiz=q,
                student=user,
                status='SUBMITTED'
            ).aggregate(m=Max('percentage'))['m']
            if best_pct is not None and best_pct >= q.pass_percentage:
                has_passed = True

        if has_passed:
            quizzes_passed_count += 1
        else:
            missing_quizzes.append({
                'quiz_id': str(q.id),
                'title': q.title,
                'pass_percentage': q.pass_percentage,
            })

    all_quizzes_passed = (quizzes_passed_count == total_quizzes)
    eligible = all_lessons_completed and all_quizzes_passed

    details = {
        'enrolled': True,
        'total_lessons': len(target_lessons),
        'completed_lessons': len(target_ids & completed_lesson_ids),
        'all_lessons_completed': all_lessons_completed,
        'total_quizzes': total_quizzes,
        'quizzes_passed': quizzes_passed_count,
        'all_quizzes_passed': all_quizzes_passed,
        'missing_quizzes': missing_quizzes,
        'eligible': eligible,
    }

    return eligible, details


@transaction.atomic
def issue_certificate(user, course):
    """
    Issues a certificate for an eligible student in a course.
    If a certificate has already been issued, returns the existing record.
    Generates a unique verification code and marks enrollment as COMPLETED.
    """
    existing = Certificate.objects.filter(student=user, course=course).first()
    if existing:
        return existing, False

    eligible, details = check_course_completion(user, course)
    if not eligible:
        raise ValidationError({
            'error': 'Course completion criteria have not been satisfied.',
            'code': 'CRITERIA_NOT_MET',
            'details': details
        })

    # Generate a unique verification code
    code = None
    for _ in range(10):
        candidate = f"CERT-{uuid.uuid4().hex[:12].upper()}"
        if not Certificate.objects.filter(verification_code=candidate).exists():
            code = candidate
            break

    if not code:
        code = f"CERT-{uuid.uuid4().hex.upper()}"

    certificate = Certificate.objects.create(
        student=user,
        course=course,
        verification_code=code,
    )

    # Mark active enrollment as COMPLETED
    Enrollment.objects.filter(student=user, course=course, status='ACTIVE').update(status='COMPLETED')

    return certificate, True


def get_student_certificates(user):
    """
    Retrieves all certificates earned by the authenticated student.
    """
    return Certificate.objects.filter(
        student=user
    ).select_related('course', 'course__instructor', 'student').order_by('-issued_at')


def verify_certificate(verification_code):
    """
    Looks up a certificate by its unique verification code for public verification.
    """
    if not verification_code:
        return None
    return Certificate.objects.filter(
        verification_code=verification_code.strip()
    ).select_related('course', 'course__instructor', 'student').first()
