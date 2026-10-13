import re
from typing import Dict, Any, List
from .base import BaseAIAdapter, AIValidationError

class MockAIAdapter(BaseAIAdapter):
    """
    Deterministic mock AI adapter for testing and local development.
    Extracts sentences/phrases from the input content to produce well-formed
    educational summaries, flashcards, and MCQs without external API calls.
    """

    def _split_into_sentences(self, text: str) -> List[str]:
        cleaned = re.sub(r'\s+', ' ', text).strip()
        if not cleaned:
            return []
        sentences = [s.strip() for s in re.split(r'[.!?]+', cleaned) if len(s.strip()) > 10]
        return sentences

    def generate_summary(self, lesson_title: str, content: str) -> Dict[str, Any]:
        sentences = self._split_into_sentences(content)
        if not sentences:
            summary_text = f"This lesson covers key fundamentals and core principles of {lesson_title}."
            takeaways = [
                f"Understanding the core concepts of {lesson_title}",
                "Applying best architectural practices",
                "Reviewing implementation details"
            ]
        else:
            summary_text = f"{sentences[0]}. This overview synthesizes the main lessons regarding {lesson_title}."
            takeaways = sentences[:4] if len(sentences) >= 4 else sentences + [
                f"Essential foundation of {lesson_title}",
                "Key operational takeaways"
            ]

        return {
            "summary": summary_text,
            "key_takeaways": takeaways[:5]
        }

    def generate_flashcards(self, lesson_title: str, content: str) -> Dict[str, Any]:
        sentences = self._split_into_sentences(content)
        cards = []
        if sentences:
            for idx, sentence in enumerate(sentences[:4], start=1):
                cards.append({
                    "front": f"Key concept {idx} in {lesson_title}",
                    "back": sentence
                })
        else:
            cards = [
                {"front": f"What is the primary topic of {lesson_title}?", "back": f"The core subject is {lesson_title}."},
                {"front": f"Why is {lesson_title} important?", "back": "It provides essential domain knowledge and practical techniques."}
            ]

        return {"flashcards": cards}

    def generate_mcqs(self, lesson_title: str, content: str) -> Dict[str, Any]:
        sentences = self._split_into_sentences(content)
        concept = sentences[0] if sentences else f"fundamentals of {lesson_title}"
        
        mcqs = [
            {
                "question": f"Which of the following best describes the main focus of {lesson_title}?",
                "options": [
                    concept,
                    "An unrelated legacy operating system protocol",
                    "A hardware circuit board specification",
                    "A deprecated database driver"
                ],
                "correct_index": 0,
                "explanation": f"The primary focus of this lesson is: {concept}."
            },
            {
                "question": f"When applying {lesson_title}, what is considered a best practice?",
                "options": [
                    "Bypassing all validations",
                    "Following established standards and architectural patterns",
                    "Hardcoding configuration credentials",
                    "Disabling error logging"
                ],
                "correct_index": 1,
                "explanation": "Consistent application of architectural patterns ensures maintainability and security."
            }
        ]

        return {"mcqs": mcqs}
