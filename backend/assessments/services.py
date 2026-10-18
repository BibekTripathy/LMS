from decimal import Decimal
from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from enrollments.models import Enrollment
from .models import Quiz, Question, QuestionOption, QuizAttempt, Answer


def check_quiz_enrollment(user, quiz):
    """
    Validates that the user has access to the quiz.
    Allows staff/admin, course instructor, or enrolled students with ACTIVE enrollment.
    """
    if getattr(user, 'role', '') == 'ADMIN' or user.is_staff or user.is_superuser:
        return True

    course = quiz.course
    if course.instructor == user:
        return True

    is_enrolled = Enrollment.objects.filter(
        student=user,
        course=course,
        status='ACTIVE'
    ).exists()
    if not is_enrolled:
        raise PermissionDenied("You must be enrolled in this course to access this quiz.")
    return True


def start_quiz_attempt(user, quiz):
    """
    Starts a new quiz attempt for the student or resumes an unexpired in-progress attempt.
    Enforces active enrollment, quiz publication, and sets authoritative deadline.
    """
    check_quiz_enrollment(user, quiz)

    if quiz.status != 'PUBLISHED':
        # Allow instructor or admin to test draft quiz
        if not (getattr(user, 'role', '') == 'ADMIN' or user.is_staff or user.is_superuser or quiz.course.instructor == user):
            raise ValidationError("This quiz is currently not published.")

    # Check for existing in-progress attempt
    active_attempt = QuizAttempt.objects.filter(
        quiz=quiz,
        student=user,
        status='IN_PROGRESS'
    ).order_by('-started_at').first()

    now = timezone.now()
    if active_attempt:
        if active_attempt.deadline_at and now > active_attempt.deadline_at:
            active_attempt.status = 'EXPIRED'
            active_attempt.save(update_fields=['status'])
        else:
            # Resume existing unexpired attempt
            active_attempt.resumed = True
            return active_attempt

    # Create new attempt
    started_at = now
    deadline_at = None
    if quiz.time_limit_seconds and quiz.time_limit_seconds > 0:
        deadline_at = started_at + timedelta(seconds=quiz.time_limit_seconds)

    attempt = QuizAttempt.objects.create(
        quiz=quiz,
        student=user,
        status='IN_PROGRESS',
        started_at=started_at,
        deadline_at=deadline_at
    )
    attempt.resumed = False
    return attempt


def _parse_answer_items(answers_data):
    """Validate the answers payload ({"answers": [...]} or a bare list) with AnswerInputItemSerializer."""
    from .serializers import AnswerInputItemSerializer

    if isinstance(answers_data, dict):
        answers_data = answers_data.get('answers', [])
    if not isinstance(answers_data, list):
        raise ValidationError({'answers': 'Expected a list of answers.'})
    serializer = AnswerInputItemSerializer(data=answers_data, many=True)
    serializer.is_valid(raise_exception=True)
    return serializer.validated_data


def _expire_if_past_deadline(attempt):
    """Persist EXPIRED (outside any grading transaction) and reject the operation."""
    if attempt.status == 'IN_PROGRESS' and attempt.deadline_at and timezone.now() > attempt.deadline_at:
        QuizAttempt.objects.filter(pk=attempt.pk, status='IN_PROGRESS').update(status='EXPIRED')
        attempt.status = 'EXPIRED'
    if attempt.status == 'EXPIRED':
        raise ValidationError("The quiz deadline has expired.")


def save_attempt_answers(user, attempt, answers_data):
    """
    Saves student answers for an active attempt.
    Validates deadline, attempt ownership, and option-question relationships.
    The attempt row is locked so answers cannot change while it is being graded.
    """
    if attempt.student_id != user.id:
        raise PermissionDenied("You do not have permission to modify this attempt.")

    items = _parse_answer_items(answers_data)
    _expire_if_past_deadline(attempt)

    with transaction.atomic():
        locked = QuizAttempt.objects.select_for_update().get(pk=attempt.pk)
        if locked.status != 'IN_PROGRESS':
            raise ValidationError(f"Answers cannot be saved because attempt status is {locked.status}.")
        if locked.deadline_at and timezone.now() > locked.deadline_at:
            raise ValidationError("The quiz deadline has expired.")

        quiz_questions = {q.id: q for q in locked.quiz.questions.all()}
        quiz_options = {opt.id: opt for opt in QuestionOption.objects.filter(question__quiz=locked.quiz)}

        saved_answers = []
        for item in items:
            question = quiz_questions.get(item['question_id'])
            if not question:
                raise ValidationError(f"Question {item['question_id']} does not belong to this quiz.")

            selected_option = None
            option_id = item.get('selected_option_id')
            if option_id:
                selected_option = quiz_options.get(option_id)
                if not selected_option:
                    raise ValidationError(f"Option {option_id} does not exist.")
                if selected_option.question_id != question.id:
                    raise ValidationError(f"Option {option_id} does not belong to question {question.id}.")

            ans, _ = Answer.objects.update_or_create(
                attempt=locked,
                question=question,
                defaults={'selected_option': selected_option}
            )
            saved_answers.append(ans)

    return saved_answers


def submit_and_grade_attempt(user, attempt, answers_data=None):
    """
    Server-side grading within an atomic transaction.
    Safely rejects duplicate or expired submissions.
    """
    if attempt.student_id != user.id:
        raise PermissionDenied("You do not have permission to submit this attempt.")

    # 1. Check expiration before the transaction so the EXPIRED status persists
    _expire_if_past_deadline(attempt)

    if attempt.status == 'SUBMITTED':
        raise ValidationError("This attempt has already been submitted.")

    if attempt.status != 'IN_PROGRESS':
        raise ValidationError(f"Attempt cannot be submitted because status is {attempt.status}.")

    with transaction.atomic():
        # Lock attempt row for atomic update
        locked_attempt = QuizAttempt.objects.select_for_update().get(id=attempt.id)

        if locked_attempt.status == 'SUBMITTED':
            raise ValidationError("This attempt has already been submitted.")

        now_in_tx = timezone.now()
        if locked_attempt.status != 'IN_PROGRESS':
            raise ValidationError(f"Attempt cannot be submitted because status is {locked_attempt.status}.")
        if locked_attempt.deadline_at and now_in_tx > locked_attempt.deadline_at:
            raise ValidationError("The quiz deadline has expired.")

        # Save answers if provided in submission payload
        if answers_data:
            save_attempt_answers(user, locked_attempt, answers_data)

        # Calculate scores server-side
        questions = locked_attempt.quiz.questions.prefetch_related('options').all()
        total_marks_possible = sum(q.marks for q in questions)
        marks_obtained = Decimal('0.00')

        existing_answers = {
            str(a.question_id): a
            for a in Answer.objects.filter(attempt=locked_attempt).select_related('selected_option')
        }

        for q in questions:
            ans = existing_answers.get(str(q.id))
            correct_option_ids = {str(opt.id) for opt in q.options.all() if opt.is_correct}

            if ans and ans.selected_option_id and str(ans.selected_option_id) in correct_option_ids:
                ans.is_correct = True
                ans.marks_awarded = Decimal(q.marks)
                marks_obtained += ans.marks_awarded
            else:
                if ans:
                    ans.is_correct = False
                    ans.marks_awarded = Decimal('0.00')
                else:
                    ans = Answer(
                        attempt=locked_attempt,
                        question=q,
                        selected_option=None,
                        is_correct=False,
                        marks_awarded=Decimal('0.00')
                    )
            ans.save()

        percentage = (
            round((marks_obtained / Decimal(total_marks_possible) * Decimal('100.0')), 2)
            if total_marks_possible > 0 else Decimal('0.00')
        )
        passed = percentage >= Decimal(locked_attempt.quiz.pass_percentage)

        locked_attempt.score = marks_obtained
        locked_attempt.marks_obtained = marks_obtained
        locked_attempt.total_marks_possible = total_marks_possible
        locked_attempt.percentage = percentage
        locked_attempt.passed = passed
        locked_attempt.status = 'SUBMITTED'
        locked_attempt.submitted_at = now_in_tx
        locked_attempt.save()

        return locked_attempt


def get_student_quiz_results(user, quiz):
    """
    Retrieves the authenticated student's history of attempts for a quiz with aggregated summary.
    """
    check_quiz_enrollment(user, quiz)

    attempts = QuizAttempt.objects.filter(
        quiz=quiz,
        student=user
    ).order_by('-started_at')

    submitted_attempts = [a for a in attempts if a.status == 'SUBMITTED']
    best_score = max((a.score for a in submitted_attempts if a.score is not None), default=None)
    highest_percentage = max((a.percentage for a in submitted_attempts if a.percentage is not None), default=None)
    has_passed = any(bool(a.passed) for a in submitted_attempts)

    return {
        'quiz_id': quiz.id,
        'quiz_title': quiz.title,
        'pass_percentage': quiz.pass_percentage,
        'total_attempts': attempts.count(),
        'best_score': best_score,
        'highest_percentage': highest_percentage,
        'has_passed': has_passed,
        'attempts': attempts
    }
