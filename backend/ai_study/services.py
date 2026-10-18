import logging
from collections import OrderedDict
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from assessments.models import Answer, Question, QuestionOption, Quiz, QuizAttempt
from courses.models import Lesson
from enrollments.models import Enrollment

from .models import StudyResource
from .prompts import flashcards as flashcards_prompt
from .prompts import quiz as quiz_prompt
from .prompts import revision as revision_prompt
from .prompts import summary as summary_prompt
from .prompts.common import prepare_material, sanitize_text, truncate
from .providers import get_provider
from .providers.base import AIInvalidOutputError
from .validators import (
    FLASHCARDS_MAX_CARDS,
    MCQ_MAX_QUESTIONS,
    VALIDATORS,
    ContentValidationError,
    validate_flashcards,
    validate_mcq,
    validate_revision,
    validate_summary,
)

logger = logging.getLogger(__name__)

MIN_MATERIAL_CHARS = 50
MAX_MISSED_QUESTIONS_PER_TOPIC = 5
MAX_WEAK_TOPICS = 5


class ServiceError(Exception):
    def __init__(self, message: str, code: str, http_status: int = 400):
        super().__init__(message)
        self.message = message
        self.code = code
        self.http_status = http_status


# --- access helpers -------------------------------------------------------

def is_admin(user) -> bool:
    return getattr(user, 'role', '') == 'ADMIN' or user.is_staff or user.is_superuser


def can_manage_course(user, course) -> bool:
    return is_admin(user) or course.instructor_id == user.id


def has_active_enrollment(user, course) -> bool:
    return Enrollment.objects.filter(student=user, course=course, status='ACTIVE').exists()


def can_view_resource(user, resource: StudyResource) -> bool:
    if resource.is_revision:
        # Revisions contain one learner's performance; only that learner (or an admin) may read them.
        return resource.created_by_id == user.id or is_admin(user)
    if can_manage_course(user, resource.course):
        return True
    return resource.status == StudyResource.STATUS_PUBLISHED and has_active_enrollment(user, resource.course)


# --- generation -----------------------------------------------------------

def lesson_material(lesson: Lesson) -> str:
    parts = []
    for text in (lesson.transcript, lesson.reading_content, lesson.content):
        text = (text or '').strip()
        if text and text not in parts:
            parts.append(text)
    return '\n\n'.join(parts)


def _run_generation(spec, validate):
    """Call the provider and validate; retry a bounded number of times on invalid output only."""
    provider = get_provider()
    attempts = 1 + max(0, settings.AI_INVALID_OUTPUT_RETRIES)
    for attempt in range(1, attempts + 1):
        try:
            raw = provider.generate_json(
                task=spec.task,
                system_instruction=spec.system_instruction,
                prompt=spec.prompt,
                max_output_tokens=spec.max_output_tokens,
            )
            return validate(raw)
        except ContentValidationError as exc:
            logger.warning('AI %s output failed validation (attempt %d/%d): %s', spec.task, attempt, attempts, exc.errors[:5])
        except AIInvalidOutputError as exc:
            logger.warning('AI %s output was invalid (attempt %d/%d): %s', spec.task, attempt, attempts, exc.message)
    raise AIInvalidOutputError('The AI output did not pass validation. Please try again.')


def generate_lesson_resource(user, lesson: Lesson, resource_type: str, count=None) -> StudyResource:
    material, truncated = prepare_material(lesson_material(lesson), settings.AI_MAX_INPUT_CHARS)
    if len(material) < MIN_MATERIAL_CHARS:
        raise ServiceError(
            'This lesson needs a transcript or reading material before study resources can be generated.',
            'INSUFFICIENT_CONTENT',
        )
    if truncated:
        logger.info('Lesson %s material truncated to %d chars for AI generation.', lesson.id, settings.AI_MAX_INPUT_CHARS)

    max_tokens = settings.AI_MAX_OUTPUT_TOKENS
    if resource_type == StudyResource.TYPE_MCQ:
        count = min(count or settings.AI_MCQ_DEFAULT_COUNT, MCQ_MAX_QUESTIONS)
        spec = quiz_prompt.build(lesson.title, material, count, max_tokens)
        validate = lambda raw: validate_mcq(raw, max_questions=count)  # noqa: E731
    elif resource_type == StudyResource.TYPE_FLASHCARDS:
        count = min(count or settings.AI_FLASHCARDS_DEFAULT_COUNT, FLASHCARDS_MAX_CARDS)
        spec = flashcards_prompt.build(lesson.title, material, count, max_tokens)
        validate = lambda raw: validate_flashcards(raw, max_cards=count)  # noqa: E731
    elif resource_type == StudyResource.TYPE_SUMMARY:
        spec = summary_prompt.build(lesson.title, material, max_tokens)
        validate = validate_summary
    else:
        raise ServiceError('Unsupported resource type.', 'VALIDATION_ERROR')

    content = _run_generation(spec, validate)
    return StudyResource.objects.create(
        lesson=lesson,
        course=lesson.module.course,
        created_by=user,
        resource_type=resource_type,
        content=content,
        status=StudyResource.STATUS_DRAFT,
    )


# --- review workflow ------------------------------------------------------

def _require_editable_draft(resource: StudyResource):
    if resource.is_revision:
        raise ServiceError('Personalised revision summaries cannot be edited or published.', 'NOT_EDITABLE')
    if resource.status != StudyResource.STATUS_DRAFT:
        raise ServiceError('Only draft resources can be changed.', 'NOT_A_DRAFT')


def update_resource_content(resource: StudyResource, content) -> StudyResource:
    with transaction.atomic():
        resource = StudyResource.objects.select_for_update().get(pk=resource.pk)
        _require_editable_draft(resource)
        resource.content = VALIDATORS[resource.resource_type](content)
        resource.save(update_fields=['content', 'updated_at'])
    return resource


def publish_resource(resource: StudyResource) -> StudyResource:
    with transaction.atomic():
        resource = StudyResource.objects.select_for_update().get(pk=resource.pk)
        _require_editable_draft(resource)
        if resource.converted_quiz_id:
            # Publishing practice MCQs would reveal the answers of the graded quiz made from them.
            raise ServiceError(
                'This MCQ set was converted into a quiz; publish the quiz instead.',
                'ALREADY_CONVERTED',
            )
        resource.content = VALIDATORS[resource.resource_type](resource.content)
        resource.status = StudyResource.STATUS_PUBLISHED
        resource.published_at = timezone.now()
        resource.save(update_fields=['content', 'status', 'published_at', 'updated_at'])
    return resource


def convert_mcq_to_quiz(resource: StudyResource) -> Quiz:
    """
    Create a regular, editable DRAFT quiz from an instructor-reviewed MCQ draft.

    Only drafts can be converted: a published MCQ set has already shown its
    answers to students, so it must not become a graded quiz.
    """
    with transaction.atomic():
        resource = StudyResource.objects.select_for_update(of=('self',)).select_related('lesson').get(pk=resource.pk)
        if resource.resource_type != StudyResource.TYPE_MCQ:
            raise ServiceError('Only MCQ resources can be converted into a quiz.', 'NOT_MCQ')
        if resource.converted_quiz_id:
            raise ServiceError('This MCQ set has already been converted into a quiz.', 'ALREADY_CONVERTED')
        if resource.status != StudyResource.STATUS_DRAFT:
            raise ServiceError(
                'Published practice MCQs have already exposed their answers to students and cannot become a graded quiz.',
                'ALREADY_PUBLISHED',
            )
        content = validate_mcq(resource.content)

        quiz = Quiz.objects.create(
            course=resource.course,
            lesson=resource.lesson,
            title=content['title'],
            description='Generated from AI study material. Review every question before publishing.',
            status='DRAFT',
        )
        for q_pos, item in enumerate(content['questions'], start=1):
            question = Question.objects.create(
                quiz=quiz,
                prompt=item['prompt'],
                question_type='MCQ',
                marks=1,
                explanation=item['explanation'],
                position=q_pos,
            )
            QuestionOption.objects.bulk_create([
                QuestionOption(
                    question=question,
                    text=text,
                    is_correct=(o_pos == item['correct_option_index']),
                    position=o_pos + 1,
                )
                for o_pos, text in enumerate(item['options'])
            ])
        resource.converted_quiz = quiz
        resource.save(update_fields=['converted_quiz', 'updated_at'])
    return quiz


# --- personalised revision ------------------------------------------------

def build_performance(student, course) -> dict:
    """
    Aggregate the student's SUBMITTED attempts for this course by topic.

    A topic is the quiz's lesson when it has one, otherwise the quiz itself.
    Accuracy is marks-weighted across every submitted attempt; missed questions
    come from the most recent submitted attempt of each quiz.
    """
    attempts = list(
        QuizAttempt.objects.filter(student=student, quiz__course=course, status='SUBMITTED')
        .select_related('quiz__lesson')
        .order_by('-submitted_at')
    )
    if not attempts:
        raise ServiceError(
            'Submit at least one quiz in this course before requesting a revision summary.',
            'NO_ATTEMPTS',
        )

    latest_attempt_ids = set()
    seen_quizzes = set()
    for attempt in attempts:
        if attempt.quiz_id not in seen_quizzes:
            seen_quizzes.add(attempt.quiz_id)
            latest_attempt_ids.add(attempt.id)

    answers = (
        Answer.objects.filter(attempt__in=attempts)
        .select_related('question__quiz__lesson', 'selected_option')
        .prefetch_related('question__options')
        .order_by('question__quiz__title', 'question__position')
    )

    topics: OrderedDict = OrderedDict()
    names_in_use = set()
    for answer in answers:
        quiz = answer.question.quiz
        key = ('lesson', quiz.lesson_id) if quiz.lesson_id else ('quiz', quiz.id)
        if key not in topics:
            name = quiz.lesson.title if quiz.lesson_id else quiz.title
            if name.casefold() in names_in_use:
                name = f'{name} ({quiz.title})'
            names_in_use.add(name.casefold())
            topics[key] = {
                'topic': name,
                'lesson': quiz.lesson,
                'target_percent': quiz.pass_percentage,
                'marks_awarded': Decimal('0'),
                'marks_possible': 0,
                'answered': 0,
                'correct': 0,
                'missed': [],
            }
        t = topics[key]
        t['target_percent'] = max(t['target_percent'], quiz.pass_percentage)
        t['marks_awarded'] += answer.marks_awarded
        t['marks_possible'] += answer.question.marks
        t['answered'] += 1
        t['correct'] += 1 if answer.is_correct else 0
        if (
            not answer.is_correct
            and answer.attempt_id in latest_attempt_ids
            and len(t['missed']) < MAX_MISSED_QUESTIONS_PER_TOPIC
        ):
            correct = [o.text for o in answer.question.options.all() if o.is_correct]
            t['missed'].append({
                'question': truncate(sanitize_text(answer.question.prompt), 300)[0],
                'correct_answer': truncate(sanitize_text(correct[0]), 200)[0] if correct else '',
                'your_answer': truncate(sanitize_text(answer.selected_option.text), 200)[0] if answer.selected_option else 'No answer',
            })

    summary = []
    total_awarded, total_possible = Decimal('0'), 0
    for t in topics.values():
        accuracy = float(round(t['marks_awarded'] / t['marks_possible'] * 100, 1)) if t['marks_possible'] else 0.0
        t['accuracy_percent'] = accuracy
        total_awarded += t['marks_awarded']
        total_possible += t['marks_possible']
        summary.append(t)

    weak = sorted(
        (t for t in summary if t['accuracy_percent'] < t['target_percent']),
        key=lambda t: t['accuracy_percent'],
    )[:MAX_WEAK_TOPICS]

    return {
        'submitted_attempts': len(attempts),
        'quizzes_attempted': len(seen_quizzes),
        'overall_accuracy_percent': float(round(total_awarded / total_possible * 100, 1)) if total_possible else 0.0,
        'topics': [
            {
                'topic': t['topic'],
                'accuracy_percent': t['accuracy_percent'],
                'target_percent': t['target_percent'],
                'questions_answered': t['answered'],
                'questions_correct': t['correct'],
            }
            for t in summary
        ],
        'weak_topics': [
            {
                'topic': t['topic'],
                'accuracy_percent': t['accuracy_percent'],
                'target_percent': t['target_percent'],
                'missed_questions': t['missed'],
            }
            for t in weak
        ],
        '_weak_lessons': [t['lesson'] for t in weak if t['lesson'] is not None],
    }


def generate_revision(student, course) -> StudyResource:
    performance = build_performance(student, course)
    weak_lessons = performance.pop('_weak_lessons')

    budget = settings.AI_MAX_INPUT_CHARS // max(1, len(weak_lessons)) if weak_lessons else 0
    excerpts = []
    for lesson in weak_lessons:
        text, _ = prepare_material(lesson_material(lesson), budget)
        if text:
            excerpts.append(f'Lesson: {sanitize_text(lesson.title)}\n{text}')
    material = '\n\n'.join(excerpts) or 'No lesson material is attached to the weak topics.'

    spec = revision_prompt.build(sanitize_text(course.title), performance, material, settings.AI_MAX_OUTPUT_TOKENS)
    allowed = [t['topic'] for t in performance['weak_topics']]
    content = _run_generation(spec, lambda raw: validate_revision(raw, allowed))
    # The figures shown to the learner are the server-computed ones, never the model's.
    content['performance'] = performance

    return StudyResource.objects.create(
        lesson=None,
        course=course,
        created_by=student,
        resource_type=StudyResource.TYPE_REVISION,
        content=content,
        status=StudyResource.STATUS_PUBLISHED,
        published_at=timezone.now(),
    )
