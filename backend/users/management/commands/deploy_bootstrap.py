"""
Idempotent post-migrate setup for deployments (runs in the Vercel build).

- Creates a superuser only when DJANGO_SUPERUSER_EMAIL and DJANGO_SUPERUSER_PASSWORD are both set.
- When SEED_DEMO_DATA=1, loads the demo courses/students once, through the real API views
  (so permissions, validation and grading run exactly as in production).
"""
import os

from django.core.management.base import BaseCommand
from django.test.utils import override_settings
from rest_framework.test import APIClient

from users.models import User

DEMO_PASSWORD = 'DemoPass123!'
DEMO_INSTRUCTOR = 'instructor@demo.local'
LESSON_TEXT = (
    "{t} covers the key ideas step by step. We define the core terms, walk through a worked example, "
    "and finish with common mistakes to avoid. Key idea: practise each concept on a small example "
    "before combining them. Remember that clear names and small steps make problems easier to solve."
)
COURSES = [
    ('Python for Data Analysis', 'Programming', 'BEGINNER',
     'Learn Python from first principles and use pandas to clean, explore and summarise real datasets.',
     [('Getting Started', ['Why Python?', 'Variables and Types', 'Control Flow']),
      ('Working with Data', ['Lists and Dictionaries', 'Intro to pandas'])], True),
    ('Distributed Systems Fundamentals', 'Computer Science', 'ADVANCED',
     'Consensus, replication and fault tolerance: how Raft, Paxos and real databases stay correct.',
     [('Foundations', ['Failure Models', 'Clocks and Ordering']),
      ('Consensus', ['Paxos Explained', 'Raft in Practice'])], True),
    ('UX Design Essentials', 'Design', 'INTERMEDIATE',
     'Research, wireframe and test interfaces people enjoy using.',
     [('Research', ['User Interviews', 'Personas']), ('Design', ['Wireframing'])], False),
]


class Command(BaseCommand):
    help = 'Create the configured superuser and (optionally) seed demo data. Safe to run on every deploy.'

    def handle(self, *args, **options):
        self._ensure_superuser()
        if os.getenv('SEED_DEMO_DATA') == '1':
            if User.objects.filter(email=DEMO_INSTRUCTOR).exists():
                self.stdout.write('Demo data already present; skipping.')
            else:
                # The demo uses the offline AI provider and must not be rate limited.
                with override_settings(AI_PROVIDER='mock'):
                    self._seed_demo()
                self.stdout.write(self.style.SUCCESS('Demo data seeded.'))

    def _ensure_superuser(self):
        email, password = os.getenv('DJANGO_SUPERUSER_EMAIL'), os.getenv('DJANGO_SUPERUSER_PASSWORD')
        if not (email and password):
            return
        existing = User.objects.filter(email__iexact=email).first()
        if existing is None:
            User.objects.create_superuser(email=email, password=password)
            self.stdout.write(self.style.SUCCESS(f'Created superuser {email}.'))
            return
        # The owner may have signed up through the site first (a STUDENT account): promote it.
        # The password is left alone so a password changed later is never reset by a deploy.
        if not (existing.is_staff and existing.is_superuser and existing.role == 'ADMIN'):
            existing.is_staff = existing.is_superuser = True
            existing.role = 'ADMIN'
            existing.save(update_fields=['is_staff', 'is_superuser', 'role'])
            self.stdout.write(self.style.SUCCESS(f'Promoted existing account {email} to superuser.'))

    # --- demo data -------------------------------------------------------------------------

    def _client(self, user):
        client = APIClient()
        client.force_authenticate(user)
        return client

    @staticmethod
    def _ok(response):
        if response.status_code not in (200, 201):
            raise RuntimeError(f'{response.request["PATH_INFO"]} -> {response.status_code}: {response.content[:300]!r}')
        return response.json() if response.content else None

    def _seed_demo(self):
        ok = self._ok
        instructor = User.objects.create_user(
            email=DEMO_INSTRUCTOR, password=DEMO_PASSWORD, role='INSTRUCTOR', first_name='Ian', last_name='Instructor')
        inst = self._client(instructor)

        course_ids, lesson_ids = [], {}
        for title, category, difficulty, description, modules, publish in COURSES:
            course = ok(inst.post('/api/v1/courses/', {'title': title, 'description': description,
                                                       'category': category, 'difficulty': difficulty}, format='json'))
            course_ids.append(course['id'])
            lesson_ids[course['id']] = []
            for m_order, (m_title, lessons) in enumerate(modules, 1):
                module = ok(inst.post(f"/api/v1/courses/{course['id']}/modules/",
                                      {'title': m_title, 'order': m_order}, format='json'))
                for l_order, l_title in enumerate(lessons, 1):
                    lesson = ok(inst.post(f"/api/v1/modules/{module['id']}/lessons/", {
                        'title': l_title, 'order': l_order, 'is_required': True,
                        'transcript': LESSON_TEXT.format(t=l_title),
                        'reading_content': LESSON_TEXT.format(t=l_title) + '\n\nFurther reading: the course notes.',
                        'video_url': 'https://www.youtube.com/watch?v=rfscVS0vtbw',
                    }, format='json'))
                    lesson_ids[course['id']].append(lesson['id'])
            if publish:
                ok(inst.post(f"/api/v1/courses/{course['id']}/publish/"))
        py, ds = course_ids[0], course_ids[1]

        def make_quiz(course, title, questions, **extra):
            quiz = ok(inst.post(f'/api/v1/courses/{course}/quizzes/', {
                'title': title, 'description': 'Check your understanding.', 'pass_percentage': 60,
                'time_limit_seconds': 900, **extra}, format='json'))
            keys = []
            for prompt, opts, correct in questions:
                question = ok(inst.post(f"/api/v1/quizzes/{quiz['id']}/questions/", {
                    'prompt': prompt, 'marks': 1, 'explanation': f'The answer is "{opts[correct]}".',
                    'options': [{'text': o, 'is_correct': i == correct} for i, o in enumerate(opts)]}, format='json'))
                keys.append((question['id'], [o['id'] for o in question['options']], correct))
            ok(inst.patch(f"/api/v1/quizzes/{quiz['id']}/manage/", {'status': 'PUBLISHED'}, format='json'))
            return quiz['id'], keys

        py_quiz, py_keys = make_quiz(py, 'Python Basics Quiz', [
            ('Which type is immutable?', ['list', 'dict', 'tuple', 'set'], 2),
            ('What does len([1, 2, 3]) return?', ['2', '3', '4'], 1),
            ('Which keyword starts a loop?', ['for', 'def', 'class'], 0),
        ], max_attempts=3)
        ds_quiz, ds_keys = make_quiz(ds, 'Consensus Check', [
            ('Raft elects a leader using…', ['randomised timeouts', 'two-phase commit', 'a fixed order'], 0),
            ('In Paxos, who proposes values?', ['Learners', 'Proposers', 'Acceptors'], 1),
        ])

        for lesson in lesson_ids[py][:2]:
            for resource_type in ('SUMMARY', 'FLASHCARDS', 'MCQ'):
                resource = ok(inst.post(f'/api/v1/lessons/{lesson}/ai/generate/',
                                        {'resource_type': resource_type}, format='json'))
                ok(inst.post(f"/api/v1/resources/{resource['id']}/publish/"))

        def take(client, quiz, keys, right):
            attempt = ok(client.post(f'/api/v1/quizzes/{quiz}/start/'))
            answers = [{'question_id': qid, 'selected_option_id': opts[c if i < right else (c + 1) % len(opts)]}
                       for i, (qid, opts, c) in enumerate(keys)]
            ok(client.post(f"/api/v1/attempts/{attempt['id']}/submit/", {'answers': answers}, format='json'))

        students = {}
        for email, first, last in [('student@demo.local', 'Sam', 'Student'), ('alice@demo.local', 'Alice', 'Rao'),
                                   ('bob@demo.local', 'Bob', 'Iyer')]:
            students[email] = self._client(User.objects.create_user(
                email=email, password=DEMO_PASSWORD, first_name=first, last_name=last))
        sam, alice, bob = students['student@demo.local'], students['alice@demo.local'], students['bob@demo.local']

        for client in (sam, alice, bob):
            ok(client.post(f'/api/v1/courses/{py}/enroll/'))
        ok(sam.post(f'/api/v1/courses/{ds}/enroll/'))
        ok(alice.post(f'/api/v1/courses/{ds}/enroll/'))

        for lesson in lesson_ids[py]:
            ok(alice.post(f'/api/v1/lessons/{lesson}/complete/'))
        take(alice, py_quiz, py_keys, right=1)
        take(alice, py_quiz, py_keys, right=3)
        ok(alice.get(f'/api/v1/courses/{py}/certificate/'))

        for lesson in lesson_ids[py][:2]:
            ok(bob.post(f'/api/v1/lessons/{lesson}/complete/'))
        take(bob, py_quiz, py_keys, right=2)

        for lesson in lesson_ids[py][:3]:
            ok(sam.post(f'/api/v1/lessons/{lesson}/complete/'))
        ok(sam.patch(f'/api/v1/lessons/{lesson_ids[py][3]}/progress/', {'last_position_seconds': 95}, format='json'))
        take(sam, py_quiz, py_keys, right=2)
        ok(sam.post(f'/api/v1/lessons/{lesson_ids[ds][0]}/complete/'))
        take(sam, ds_quiz, ds_keys, right=1)
        take(alice, ds_quiz, ds_keys, right=2)
        ok(sam.post(f'/api/v1/courses/{py}/ai/revisions/', {}, format='json'))
