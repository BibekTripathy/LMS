"""
Structural and semantic validation for study-resource content.

Used for both AI output (before anything is saved) and instructor edits.
Each validator returns a cleaned copy containing only known keys with trimmed
strings, or raises ContentValidationError listing every problem found.
"""
from typing import Any, Iterable, Optional

MCQ_MAX_QUESTIONS = 20
MCQ_MIN_OPTIONS = 2
MCQ_MAX_OPTIONS = 6
FLASHCARDS_MAX_CARDS = 40


class ContentValidationError(Exception):
    def __init__(self, errors: list[str]):
        super().__init__('; '.join(errors))
        self.errors = errors


class _Checker:
    def __init__(self):
        self.errors: list[str] = []

    def fail(self, path: str, message: str):
        self.errors.append(f'{path}: {message}')

    def text(self, value: Any, path: str, min_len: int = 1, max_len: int = 1000) -> Optional[str]:
        if not isinstance(value, str):
            self.fail(path, 'must be a string')
            return None
        value = ' '.join(value.split()) if '\n' not in value else value.strip()
        if len(value) < min_len:
            self.fail(path, 'is required' if min_len == 1 else f'must be at least {min_len} characters')
            return None
        if len(value) > max_len:
            self.fail(path, f'must be at most {max_len} characters')
            return None
        return value

    def items(self, value: Any, path: str, min_items: int, max_items: int) -> list:
        if not isinstance(value, list):
            self.fail(path, 'must be a list')
            return []
        if len(value) < min_items:
            self.fail(path, f'must contain at least {min_items} item(s)')
        if len(value) > max_items:
            self.fail(path, f'must contain at most {max_items} item(s)')
        return value[:max_items]

    def obj(self, value: Any, path: str) -> dict:
        if not isinstance(value, dict):
            self.fail(path, 'must be an object')
            return {}
        return value

    def text_list(self, value: Any, path: str, min_items: int, max_items: int, max_len: int) -> list[str]:
        out = []
        for i, item in enumerate(self.items(value, path, min_items, max_items)):
            text = self.text(item, f'{path}[{i}]', max_len=max_len)
            if text is not None:
                out.append(text)
        return out

    def done(self, cleaned: dict) -> dict:
        if self.errors:
            raise ContentValidationError(self.errors)
        return cleaned


def validate_mcq(data: Any, max_questions: int = MCQ_MAX_QUESTIONS) -> dict:
    c = _Checker()
    data = c.obj(data, 'content')
    cleaned = {'title': c.text(data.get('title'), 'title', max_len=200), 'questions': []}

    for i, raw in enumerate(c.items(data.get('questions'), 'questions', 1, max_questions)):
        path = f'questions[{i}]'
        q = c.obj(raw, path)
        prompt = c.text(q.get('prompt'), f'{path}.prompt', min_len=5, max_len=500)
        options = []
        raw_options = c.items(q.get('options'), f'{path}.options', MCQ_MIN_OPTIONS, MCQ_MAX_OPTIONS)
        for j, opt in enumerate(raw_options):
            text = c.text(opt, f'{path}.options[{j}]', max_len=300)
            if text is not None:
                options.append(text)
        if len({o.casefold() for o in options}) != len(options):
            c.fail(f'{path}.options', 'must not contain duplicates')

        index = q.get('correct_option_index')
        # bool is a subclass of int in Python; reject it explicitly.
        if isinstance(index, bool) or not isinstance(index, int):
            c.fail(f'{path}.correct_option_index', 'must be an integer')
        elif not 0 <= index < len(raw_options):
            c.fail(f'{path}.correct_option_index', f'must be between 0 and {max(len(raw_options) - 1, 0)}')

        explanation = q.get('explanation', '')
        explanation = c.text(explanation, f'{path}.explanation', min_len=0, max_len=1000) if explanation else ''
        cleaned['questions'].append({
            'prompt': prompt,
            'options': options,
            'correct_option_index': index,
            'explanation': explanation or '',
        })
    return c.done(cleaned)


def validate_flashcards(data: Any, max_cards: int = FLASHCARDS_MAX_CARDS) -> dict:
    c = _Checker()
    data = c.obj(data, 'content')
    cleaned = {'title': c.text(data.get('title'), 'title', max_len=200), 'cards': []}
    fronts = set()
    for i, raw in enumerate(c.items(data.get('cards'), 'cards', 1, max_cards)):
        card = c.obj(raw, f'cards[{i}]')
        front = c.text(card.get('front'), f'cards[{i}].front', max_len=300)
        back = c.text(card.get('back'), f'cards[{i}].back', max_len=1000)
        if front and front.casefold() in fronts:
            c.fail(f'cards[{i}].front', 'duplicates another card')
        if front:
            fronts.add(front.casefold())
        cleaned['cards'].append({'front': front, 'back': back})
    return c.done(cleaned)


def validate_summary(data: Any) -> dict:
    c = _Checker()
    data = c.obj(data, 'content')
    return c.done({
        'title': c.text(data.get('title'), 'title', max_len=200),
        'summary': c.text(data.get('summary'), 'summary', min_len=20, max_len=4000),
        'key_points': c.text_list(data.get('key_points'), 'key_points', 1, 15, 500),
        'revision_topics': c.text_list(data.get('revision_topics', []), 'revision_topics', 0, 15, 200),
    })


def validate_revision(data: Any, allowed_topics: Iterable[str]) -> dict:
    """`allowed_topics` are the server-computed weak topics; the model may not invent others."""
    c = _Checker()
    data = c.obj(data, 'content')
    allowed = {t.casefold(): t for t in allowed_topics}
    cleaned = {
        'title': c.text(data.get('title'), 'title', max_len=200),
        'overview': c.text(data.get('overview'), 'overview', max_len=2000),
        'focus_areas': [],
        'next_steps': c.text_list(data.get('next_steps', []), 'next_steps', 0, 10, 500),
    }
    seen = set()
    for i, raw in enumerate(c.items(data.get('focus_areas'), 'focus_areas', 1 if allowed else 0, 10)):
        path = f'focus_areas[{i}]'
        area = c.obj(raw, path)
        topic = c.text(area.get('topic'), f'{path}.topic', max_len=200)
        if topic is not None:
            key = topic.casefold()
            if key not in allowed:
                c.fail(f'{path}.topic', 'is not one of the learner\'s weak topics')
            elif key in seen:
                c.fail(f'{path}.topic', 'is duplicated')
            else:
                topic = allowed[key]
            seen.add(key)
        cleaned['focus_areas'].append({
            'topic': topic,
            'reason': c.text(area.get('reason'), f'{path}.reason', max_len=1000),
            'actions': c.text_list(area.get('actions'), f'{path}.actions', 1, 8, 500),
        })
    return c.done(cleaned)


VALIDATORS = {
    'MCQ': validate_mcq,
    'FLASHCARDS': validate_flashcards,
    'SUMMARY': validate_summary,
}
