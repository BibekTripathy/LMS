"""API tests for ai_study. The AI provider is always replaced with a fake; no network calls."""
import json
from decimal import Decimal

import pytest
from django.core.cache import cache
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework.throttling import ScopedRateThrottle

from ai_study.models import StudyResource
from ai_study.prompts.common import DATA_END, DATA_START, extract_between
from ai_study.providers.base import AIQuotaExhaustedError, AIRateLimitError, AITimeoutError
from assessments.models import Answer, Question, QuestionOption, Quiz, QuizAttempt
from courses.models import Course, Lesson, Module
from enrollments.models import Enrollment
from users.models import User

LESSON_TEXT = (
    'Routing is performed by the network layer. The transport layer provides end-to-end delivery. '
    'TCP is connection oriented while UDP is connectionless. IP addresses identify hosts on a network.'
)

MCQ = {
    'title': 'Networking basics',
    'questions': [
        {'prompt': 'Which layer performs routing?', 'options': ['Application', 'Transport', 'Network', 'Physical'],
         'correct_option_index': 2, 'explanation': 'The network layer performs routing.'},
        {'prompt': 'Which protocol is connectionless?', 'options': ['TCP', 'UDP', 'HTTP', 'FTP'],
         'correct_option_index': 1, 'explanation': 'UDP is connectionless.'},
    ],
}
FLASHCARDS = {'title': 'Cards', 'cards': [{'front': 'Routing layer?', 'back': 'Network layer'}]}
SUMMARY = {'title': 'Summary', 'summary': 'The lesson explains layers of the network stack.',
           'key_points': ['Routing happens at the network layer.'], 'revision_topics': ['Layers']}


class FakeProvider:
    name = 'fake'

    def __init__(self, *outputs):
        self.outputs = list(outputs)
        self.calls = []

    def generate_json(self, *, task, system_instruction, prompt, max_output_tokens):
        self.calls.append({'task': task, 'prompt': prompt, 'system': system_instruction})
        out = self.outputs.pop(0) if len(self.outputs) > 1 else self.outputs[0]
        if isinstance(out, Exception):
            raise out
        if callable(out):
            return out(prompt)
        return json.loads(json.dumps(out))


@pytest.fixture(autouse=True)
def _isolate(monkeypatch, settings):
    cache.clear()
    settings.AI_INVALID_OUTPUT_RETRIES = 1
    monkeypatch.setattr(ScopedRateThrottle, 'THROTTLE_RATES', {'ai_generate': '100/hour'})
    yield
    cache.clear()


@pytest.fixture
def use_provider(monkeypatch):
    def install(*outputs):
        provider = FakeProvider(*outputs)
        monkeypatch.setattr('ai_study.services.get_provider', lambda: provider)
        return provider
    return install


@pytest.fixture
def data():
    instructor = User.objects.create_user(email='prof@example.com', password='pw', role='INSTRUCTOR')
    other_instructor = User.objects.create_user(email='other@example.com', password='pw', role='INSTRUCTOR')
    student = User.objects.create_user(email='alice.student@example.com', password='pw', role='STUDENT',
                                       first_name='Alice', last_name='Learner')
    outsider = User.objects.create_user(email='bob@example.com', password='pw', role='STUDENT')
    admin = User.objects.create_user(email='admin@example.com', password='pw', role='ADMIN', is_staff=True)

    course = Course.objects.create(title='Computer Networks', instructor=instructor, status='PUBLISHED')
    module = Module.objects.create(course=course, title='Layers', order=1)
    lesson = Lesson.objects.create(module=module, title='Network layer', transcript=LESSON_TEXT, order=1)
    lesson2 = Lesson.objects.create(module=module, title='Transport layer',
                                    reading_content='TCP provides reliable ordered delivery using acknowledgements.',
                                    order=2)
    empty = Lesson.objects.create(module=module, title='Empty', order=3)
    Enrollment.objects.create(student=student, course=course, status='ACTIVE')
    return dict(instructor=instructor, other_instructor=other_instructor, student=student, outsider=outsider,
                admin=admin, course=course, lesson=lesson, lesson2=lesson2, empty=empty)


def client_for(user):
    client = APIClient()
    if user:
        client.force_authenticate(user=user)
    return client


def generate(user, lesson, resource_type='MCQ', **extra):
    return client_for(user).post(f'/api/v1/lessons/{lesson.id}/ai/generate/',
                                 {'resource_type': resource_type, **extra}, format='json')


def make_resource(data, resource_type='MCQ', content=None, status='DRAFT'):
    return StudyResource.objects.create(
        lesson=data['lesson'], course=data['course'], created_by=data['instructor'],
        resource_type=resource_type, content=content or MCQ, status=status,
    )


@pytest.mark.django_db
class TestGeneration:
    @pytest.mark.parametrize('resource_type, output', [('MCQ', MCQ), ('FLASHCARDS', FLASHCARDS), ('SUMMARY', SUMMARY)])
    def test_instructor_generates_draft(self, data, use_provider, resource_type, output):
        provider = use_provider(output)
        res = generate(data['instructor'], data['lesson'], resource_type)
        assert res.status_code == 201, res.data
        assert res.data['status'] == 'DRAFT' and res.data['resource_type'] == resource_type
        resource = StudyResource.objects.get(id=res.data['id'])
        assert resource.created_by == data['instructor'] and resource.course == data['course']
        # Grounding: the lesson material is what gets sent.
        assert 'Routing is performed by the network layer.' in provider.calls[0]['prompt']

    def test_prompt_contains_no_user_identity(self, data, use_provider):
        provider = use_provider(MCQ)
        generate(data['instructor'], data['lesson'])
        prompt = provider.calls[0]['prompt']
        assert 'prof@example.com' not in prompt and str(data['instructor'].id) not in prompt

    def test_student_cannot_generate(self, data, use_provider):
        provider = use_provider(MCQ)
        res = generate(data['student'], data['lesson'])
        assert res.status_code == 403 and res.data['code'] == 'NOT_COURSE_INSTRUCTOR'
        assert provider.calls == [] and StudyResource.objects.count() == 0

    def test_other_instructor_cannot_generate(self, data, use_provider):
        use_provider(MCQ)
        assert generate(data['other_instructor'], data['lesson']).status_code == 403

    def test_admin_can_generate(self, data, use_provider):
        use_provider(MCQ)
        assert generate(data['admin'], data['lesson']).status_code == 201

    def test_unauthenticated_is_rejected(self, data, use_provider):
        use_provider(MCQ)
        assert generate(None, data['lesson']).status_code == 401

    def test_lesson_without_material_is_rejected(self, data, use_provider):
        provider = use_provider(MCQ)
        res = generate(data['instructor'], data['empty'])
        assert res.status_code == 400 and res.data['code'] == 'INSUFFICIENT_CONTENT'
        assert provider.calls == []

    def test_invalid_resource_type_and_count(self, data, use_provider):
        use_provider(MCQ)
        assert generate(data['instructor'], data['lesson'], 'REVISION').status_code == 400
        assert generate(data['instructor'], data['lesson'], 'MCQ', count=500).status_code == 400

    def test_malformed_output_is_retried_then_rejected_and_nothing_saved(self, data, use_provider):
        bad = {'title': 'x', 'questions': [{'prompt': 'Which?', 'options': ['only one'], 'correct_option_index': 0}]}
        provider = use_provider(bad)
        res = generate(data['instructor'], data['lesson'])
        assert res.status_code == 502 and res.data['code'] == 'AI_INVALID_OUTPUT'
        assert len(provider.calls) == 2  # one initial attempt + AI_INVALID_OUTPUT_RETRIES
        assert StudyResource.objects.count() == 0

    def test_wrong_correct_index_then_valid_retry_succeeds(self, data, use_provider):
        bad = json.loads(json.dumps(MCQ))
        bad['questions'][0]['correct_option_index'] = 7
        provider = use_provider(bad, MCQ)
        res = generate(data['instructor'], data['lesson'])
        assert res.status_code == 201 and len(provider.calls) == 2

    def test_extra_questions_are_rejected_beyond_requested_count(self, data, use_provider):
        use_provider(MCQ)  # two questions
        res = generate(data['instructor'], data['lesson'], 'MCQ', count=1)
        assert res.status_code == 502

    @pytest.mark.parametrize('error, status_code, code', [
        (AITimeoutError('timeout'), 504, 'AI_TIMEOUT'),
        (AIRateLimitError('slow down', retry_after=30), 503, 'AI_RATE_LIMITED'),
        (AIQuotaExhaustedError('quota'), 503, 'AI_QUOTA_EXHAUSTED'),
    ])
    def test_provider_failures_map_to_clear_errors(self, data, use_provider, error, status_code, code):
        use_provider(error)
        res = generate(data['instructor'], data['lesson'])
        assert res.status_code == status_code and res.data['code'] == code
        assert StudyResource.objects.count() == 0
        if error.retry_after:
            assert res['Retry-After'] == '30'

    def test_per_user_rate_limit(self, data, use_provider, monkeypatch):
        monkeypatch.setattr(ScopedRateThrottle, 'THROTTLE_RATES', {'ai_generate': '2/hour'})
        use_provider(MCQ)
        assert generate(data['instructor'], data['lesson']).status_code == 201
        assert generate(data['instructor'], data['lesson']).status_code == 201
        res = generate(data['instructor'], data['lesson'])
        assert res.status_code == 429 and res.data['code'] == 'RATE_LIMITED'
        # The limit is per user, not global.
        assert generate(data['admin'], data['lesson']).status_code == 201


@pytest.mark.django_db
class TestVisibilityAndReview:
    def test_student_sees_only_published_resources(self, data):
        draft = make_resource(data)
        published = make_resource(data, 'FLASHCARDS', FLASHCARDS, status='PUBLISHED')
        res = client_for(data['student']).get(f"/api/v1/lessons/{data['lesson'].id}/resources/")
        assert res.status_code == 200
        assert [r['id'] for r in res.data['results']] == [str(published.id)]
        assert client_for(data['student']).get(f'/api/v1/resources/{draft.id}/').status_code == 404
        assert client_for(data['student']).get(f'/api/v1/resources/{published.id}/').status_code == 200

    def test_instructor_sees_drafts(self, data):
        make_resource(data)
        res = client_for(data['instructor']).get(f"/api/v1/lessons/{data['lesson'].id}/resources/")
        assert res.status_code == 200 and res.data['count'] == 1

    def test_unenrolled_student_cannot_list_or_read(self, data):
        published = make_resource(data, status='PUBLISHED')
        assert client_for(data['outsider']).get(f"/api/v1/lessons/{data['lesson'].id}/resources/").status_code == 403
        assert client_for(data['outsider']).get(f'/api/v1/resources/{published.id}/').status_code == 404

    def test_dropped_enrollment_loses_access(self, data):
        published = make_resource(data, status='PUBLISHED')
        Enrollment.objects.filter(student=data['student']).update(status='DROPPED')
        assert client_for(data['student']).get(f'/api/v1/resources/{published.id}/').status_code == 404

    def test_instructor_edits_draft_with_validation(self, data):
        resource = make_resource(data)
        edited = json.loads(json.dumps(MCQ))
        edited['questions'][0]['prompt'] = 'Which OSI layer handles routing?'
        res = client_for(data['instructor']).patch(f'/api/v1/resources/{resource.id}/', {'content': edited}, format='json')
        assert res.status_code == 200
        resource.refresh_from_db()
        assert resource.content['questions'][0]['prompt'] == 'Which OSI layer handles routing?'

        edited['questions'][0]['correct_option_index'] = 9
        res = client_for(data['instructor']).patch(f'/api/v1/resources/{resource.id}/', {'content': edited}, format='json')
        assert res.status_code == 400 and res.data['code'] == 'VALIDATION_ERROR'
        assert any('correct_option_index' in e for e in res.data['details']['content'])

    def test_other_instructor_and_student_cannot_edit_or_publish(self, data):
        resource = make_resource(data)
        for user in (data['other_instructor'], data['student']):
            client = client_for(user)
            assert client.patch(f'/api/v1/resources/{resource.id}/', {'content': MCQ}, format='json').status_code == 403
            assert client.post(f'/api/v1/resources/{resource.id}/publish/').status_code == 403
            assert client.post(f'/api/v1/resources/{resource.id}/convert-to-quiz/').status_code == 403
        resource.refresh_from_db()
        assert resource.status == 'DRAFT'

    def test_publish_flow(self, data):
        resource = make_resource(data, 'SUMMARY', SUMMARY)
        client = client_for(data['instructor'])
        res = client.post(f'/api/v1/resources/{resource.id}/publish/')
        assert res.status_code == 200 and res.data['status'] == 'PUBLISHED' and res.data['published_at']
        # Published resources are frozen.
        assert client.post(f'/api/v1/resources/{resource.id}/publish/').status_code == 400
        assert client.patch(f'/api/v1/resources/{resource.id}/', {'content': SUMMARY}, format='json').status_code == 400
        assert client_for(data['student']).get(f'/api/v1/resources/{resource.id}/').status_code == 200

    def test_publish_rejects_content_that_no_longer_validates(self, data):
        resource = make_resource(data, content={'title': 'x', 'questions': []})
        res = client_for(data['instructor']).post(f'/api/v1/resources/{resource.id}/publish/')
        assert res.status_code == 400
        resource.refresh_from_db()
        assert resource.status == 'DRAFT'


@pytest.mark.django_db
class TestConvertToQuiz:
    def test_converts_draft_mcq_into_editable_draft_quiz(self, data):
        resource = make_resource(data)
        res = client_for(data['instructor']).post(f'/api/v1/resources/{resource.id}/convert-to-quiz/')
        assert res.status_code == 201, res.data
        quiz = Quiz.objects.get(id=res.data['id'])
        assert quiz.status == 'DRAFT' and quiz.course == data['course'] and quiz.lesson == data['lesson']
        assert quiz.title == 'Networking basics'
        questions = list(quiz.questions.order_by('position'))
        assert [q.prompt for q in questions] == [q['prompt'] for q in MCQ['questions']]
        assert [q.position for q in questions] == [1, 2]
        options = list(questions[0].options.order_by('position'))
        assert [o.text for o in options] == MCQ['questions'][0]['options']
        assert [o.is_correct for o in options] == [False, False, True, False]
        assert questions[1].options.get(is_correct=True).text == 'UDP'
        assert questions[0].explanation == 'The network layer performs routing.'
        # Response is the student-safe quiz view: no correct answers.
        assert 'is_correct' not in json.dumps(res.data, default=str)
        resource.refresh_from_db()
        assert resource.converted_quiz == quiz

    def test_converted_quiz_is_regular_and_gradable(self, data):
        resource = make_resource(data)
        client_for(data['instructor']).post(f'/api/v1/resources/{resource.id}/convert-to-quiz/')
        quiz = Quiz.objects.get()
        quiz.status = 'PUBLISHED'
        quiz.save()
        student = client_for(data['student'])
        attempt = student.post(f'/api/v1/quizzes/{quiz.id}/start/').data
        answers = [{'question_id': str(q.id), 'selected_option_id': str(q.options.get(is_correct=True).id)}
                   for q in quiz.questions.all()]
        res = student.post(f"/api/v1/attempts/{attempt['id']}/submit/", {'answers': answers}, format='json')
        assert res.status_code == 200 and Decimal(res.data['percentage']) == Decimal('100')

    def test_cannot_convert_twice_published_or_non_mcq(self, data):
        client = client_for(data['instructor'])
        resource = make_resource(data)
        assert client.post(f'/api/v1/resources/{resource.id}/convert-to-quiz/').status_code == 201
        res = client.post(f'/api/v1/resources/{resource.id}/convert-to-quiz/')
        assert res.status_code == 400 and res.data['code'] == 'ALREADY_CONVERTED'
        # A converted MCQ set must not be published as practice (it would reveal the quiz answers).
        assert client.post(f'/api/v1/resources/{resource.id}/publish/').data['code'] == 'ALREADY_CONVERTED'

        published = make_resource(data, status='PUBLISHED')
        assert client.post(f'/api/v1/resources/{published.id}/convert-to-quiz/').data['code'] == 'ALREADY_PUBLISHED'
        cards = make_resource(data, 'FLASHCARDS', FLASHCARDS)
        assert client.post(f'/api/v1/resources/{cards.id}/convert-to-quiz/').data['code'] == 'NOT_MCQ'
        assert Quiz.objects.count() == 1


def _quiz_with_questions(course, lesson, title, specs, pass_percentage=70):
    quiz = Quiz.objects.create(course=course, lesson=lesson, title=title, status='PUBLISHED',
                               pass_percentage=pass_percentage)
    out = []
    for pos, (prompt, correct, wrong) in enumerate(specs, start=1):
        q = Question.objects.create(quiz=quiz, prompt=prompt, marks=1, position=pos)
        right = QuestionOption.objects.create(question=q, text=correct, is_correct=True, position=1)
        bad = QuestionOption.objects.create(question=q, text=wrong, is_correct=False, position=2)
        out.append((q, right, bad))
    return quiz, out


def _submitted_attempt(student, quiz, choices):
    """choices: list of (question, option) pairs. Graded like assessments does."""
    attempt = QuizAttempt.objects.create(quiz=quiz, student=student, status='SUBMITTED', submitted_at=timezone.now())
    for question, option in choices:
        Answer.objects.create(attempt=attempt, question=question, selected_option=option,
                              is_correct=option.is_correct, marks_awarded=Decimal(question.marks if option.is_correct else 0))
    return attempt


@pytest.mark.django_db
class TestRevision:
    @pytest.fixture
    def attempts(self, data):
        network_quiz, nq = _quiz_with_questions(data['course'], data['lesson'], 'Network quiz', [
            ('Which layer routes packets?', 'Network', 'Physical'),
            ('What identifies a host?', 'IP address', 'Port'),
        ])
        transport_quiz, tq = _quiz_with_questions(data['course'], data['lesson2'], 'Transport quiz', [
            ('Is TCP reliable?', 'Yes', 'No'),
            ('Does TCP use acknowledgements?', 'Yes', 'No'),
        ])
        # Network: both wrong (0%). Transport: both right (100%).
        _submitted_attempt(data['student'], network_quiz, [(q, bad) for q, _, bad in nq])
        _submitted_attempt(data['student'], transport_quiz, [(q, right) for q, right, _ in tq])
        # An in-progress attempt must be ignored.
        QuizAttempt.objects.create(quiz=network_quiz, student=data['student'], status='IN_PROGRESS')
        return network_quiz, transport_quiz

    def _echo_weak_topics(self, prompt):
        perf = json.loads(extract_between(prompt, DATA_START, DATA_END))
        return {
            'title': 'Revision plan', 'overview': 'Focus on your weakest topic.',
            'focus_areas': [{'topic': t['topic'], 'reason': 'Low accuracy.', 'actions': ['Re-read the lesson.']}
                            for t in perf['weak_topics']],
            'next_steps': ['Retake the quiz.'],
        }

    def test_revision_uses_real_attempts(self, data, attempts, use_provider):
        provider = use_provider(self._echo_weak_topics)
        res = client_for(data['student']).post(f"/api/v1/courses/{data['course'].id}/ai/revisions/")
        assert res.status_code == 201, res.data

        sent = json.loads(extract_between(provider.calls[0]['prompt'], DATA_START, DATA_END))
        assert sent['submitted_attempts'] == 2
        assert [t['topic'] for t in sent['weak_topics']] == ['Network layer']
        assert sent['weak_topics'][0]['accuracy_percent'] == 0.0
        missed = sent['weak_topics'][0]['missed_questions']
        assert {'question': 'Which layer routes packets?', 'correct_answer': 'Network', 'your_answer': 'Physical'} in missed
        assert {t['topic']: t['accuracy_percent'] for t in sent['topics']} == {'Network layer': 0.0, 'Transport layer': 100.0}
        # Weak-topic lesson material is included for grounding; strong topics are not.
        assert 'Routing is performed by the network layer.' in provider.calls[0]['prompt']
        assert 'acknowledgements' not in extract_between(provider.calls[0]['prompt'], '<<<COURSE_MATERIAL>>>', '<<<END_COURSE_MATERIAL>>>')
        # No personal data leaves the server.
        prompt = provider.calls[0]['prompt']
        for secret in ('alice.student@example.com', 'Alice', 'Learner', str(data['student'].id)):
            assert secret not in prompt

        resource = StudyResource.objects.get(id=res.data['id'])
        assert resource.resource_type == 'REVISION' and resource.lesson is None
        assert resource.created_by == data['student']
        assert resource.content['focus_areas'][0]['topic'] == 'Network layer'
        assert resource.content['performance']['overall_accuracy_percent'] == 50.0

    def test_revision_requires_submitted_attempts(self, data, use_provider):
        provider = use_provider(self._echo_weak_topics)
        res = client_for(data['student']).post(f"/api/v1/courses/{data['course'].id}/ai/revisions/")
        assert res.status_code == 400 and res.data['code'] == 'NO_ATTEMPTS'
        assert provider.calls == []

    def test_revision_rejects_invented_topics(self, data, attempts, use_provider):
        invented = {'title': 'Plan', 'overview': 'o', 'next_steps': [],
                    'focus_areas': [{'topic': 'Astrophysics', 'reason': 'r', 'actions': ['a']}]}
        use_provider(invented)
        res = client_for(data['student']).post(f"/api/v1/courses/{data['course'].id}/ai/revisions/")
        assert res.status_code == 502 and StudyResource.objects.count() == 0

    def test_revision_is_private_to_its_student(self, data, attempts, use_provider):
        use_provider(self._echo_weak_topics)
        res = client_for(data['student']).post(f"/api/v1/courses/{data['course'].id}/ai/revisions/")
        rid = res.data['id']
        assert client_for(data['student']).get(f'/api/v1/resources/{rid}/').status_code == 200
        assert client_for(data['instructor']).get(f'/api/v1/resources/{rid}/').status_code == 404
        assert client_for(data['outsider']).get(f'/api/v1/resources/{rid}/').status_code == 404
        assert client_for(data['instructor']).patch(f'/api/v1/resources/{rid}/', {'content': {}}, format='json').status_code == 403
        listing = client_for(data['student']).get(f"/api/v1/courses/{data['course'].id}/ai/revisions/")
        assert listing.status_code == 200 and listing.data['count'] == 1

    def test_unenrolled_student_cannot_request_revision(self, data, use_provider):
        use_provider(self._echo_weak_topics)
        assert client_for(data['outsider']).post(f"/api/v1/courses/{data['course'].id}/ai/revisions/").status_code == 403
        assert client_for(data['outsider']).get(f"/api/v1/courses/{data['course'].id}/ai/revisions/").status_code == 403


@pytest.mark.django_db
class TestMockProviderEndToEnd:
    """AI_PROVIDER=mock is the offline demo provider; its output must pass the same validators."""

    def test_mock_provider_generates_every_type_and_revision(self, data, settings):
        settings.AI_PROVIDER = 'mock'
        for resource_type in ('MCQ', 'FLASHCARDS', 'SUMMARY'):
            res = generate(data['instructor'], data['lesson'], resource_type, **({'count': 3} if resource_type != 'SUMMARY' else {}))
            assert res.status_code == 201, (resource_type, res.data)
        mcq = StudyResource.objects.get(resource_type='MCQ')
        assert client_for(data['instructor']).post(f'/api/v1/resources/{mcq.id}/convert-to-quiz/').status_code == 201

        quiz, qs = _quiz_with_questions(data['course'], data['lesson'], 'Network quiz', [('Which layer routes?', 'Network', 'Physical')])
        _submitted_attempt(data['student'], quiz, [(qs[0][0], qs[0][2])])
        res = client_for(data['student']).post(f"/api/v1/courses/{data['course'].id}/ai/revisions/")
        assert res.status_code == 201, res.data
        assert res.data['content']['focus_areas'][0]['topic'] == 'Network layer'

    def test_unknown_provider_is_a_configuration_error(self, data, settings):
        settings.AI_PROVIDER = 'nonexistent'
        res = generate(data['instructor'], data['lesson'])
        assert res.status_code == 503 and res.data['code'] == 'AI_NOT_CONFIGURED'
