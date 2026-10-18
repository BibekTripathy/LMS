"""
Deterministic offline provider for local development and demos without an API key.

It builds schema-valid output from the sentences of the supplied material, so
the whole generate → review → publish flow can be exercised end to end.
It is not an AI and its questions are simplistic by design.
"""
import json
import re
from typing import Any

from ..prompts.common import DATA_END, DATA_START, MATERIAL_END, MATERIAL_START, extract_between
from .base import AIProvider

_COUNT_RE = re.compile(r'^Write (\d+) ', re.MULTILINE)


def _sentences(material: str) -> list[str]:
    body = re.sub(r'^Lesson title:.*$|^Course title:.*$', '', material, flags=re.MULTILINE)
    parts = re.split(r'(?<=[.!?])\s+', re.sub(r'\s+', ' ', body).strip())
    return [p.strip() for p in parts if len(p.strip()) >= 20][:30]


class MockProvider(AIProvider):
    name = 'mock'

    def generate_json(self, *, task: str, system_instruction: str, prompt: str, max_output_tokens: int) -> Any:
        material = extract_between(prompt, MATERIAL_START, MATERIAL_END)
        sentences = _sentences(material) or ['This lesson introduces its core concepts and terminology.']
        match = _COUNT_RE.search(prompt)
        count = int(match.group(1)) if match else 3

        if task == 'mcq':
            questions = []
            for i in range(min(count, len(sentences))):
                distractors = [s for s in sentences if s != sentences[i]][:3]
                while len(distractors) < 3:
                    distractors.append(f'A statement not made in this lesson ({len(distractors) + 1}).')
                options = [sentences[i]] + distractors
                shift = i % 4
                options = options[shift:] + options[:shift]
                questions.append({
                    'prompt': f'Which statement appears in the lesson material? (#{i + 1})',
                    'options': options,
                    'correct_option_index': options.index(sentences[i]),
                    'explanation': 'This statement is taken directly from the lesson material.',
                })
            return {'title': 'Practice questions', 'questions': questions}

        if task == 'flashcards':
            cards = [{'front': f'Key idea {i + 1}', 'back': s} for i, s in enumerate(sentences[:count])]
            return {'title': 'Flashcards', 'cards': cards}

        if task == 'summary':
            return {
                'title': 'Lesson summary',
                'summary': ' '.join(sentences[:3]),
                'key_points': sentences[:5],
                'revision_topics': [s[:80] for s in sentences[:3]],
            }

        if task == 'revision':
            try:
                data = json.loads(extract_between(prompt, DATA_START, DATA_END) or '{}')
            except ValueError:
                data = {}
            weak = data.get('weak_topics') or []
            return {
                'title': 'Your revision plan',
                'overview': f"You have {len(weak)} topic(s) below your target score.",
                'focus_areas': [
                    {
                        'topic': t['topic'],
                        'reason': f"Your accuracy on this topic is {t.get('accuracy_percent', 0)}%.",
                        'actions': ['Re-read the lesson material for this topic.', 'Retake the related quiz.'],
                    }
                    for t in weak
                ],
                'next_steps': ['Review your missed questions and their explanations.'],
            }

        return {}
