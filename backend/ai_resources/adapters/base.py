from abc import ABC, abstractmethod
from typing import Dict, Any, List

class AIAdapterError(Exception):
    """Base exception for AI adapter errors."""
    def __init__(self, message: str, code: str = "AI_PROVIDER_ERROR", status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


class AITimeoutError(AIAdapterError):
    """Raised when an AI request times out."""
    def __init__(self, message: str = "AI service request timed out."):
        super().__init__(message, code="AI_TIMEOUT", status_code=504)


class AIQuotaExceededError(AIAdapterError):
    """Raised when provider rate limits or quotas are exceeded."""
    def __init__(self, message: str = "AI service rate limit or quota exceeded. Please try again later."):
        super().__init__(message, code="AI_QUOTA_EXCEEDED", status_code=429)


class AIValidationError(AIAdapterError):
    """Raised when the AI model returns invalid or malformed structured data."""
    def __init__(self, message: str = "AI output did not match required format."):
        super().__init__(message, code="AI_MALFORMED_OUTPUT", status_code=502)


class BaseAIAdapter(ABC):
    """
    Abstract interface for AI study resource generation.
    Swappable across different model providers (Gemini, OpenAI, Mock, etc.).
    """

    @abstractmethod
    def generate_summary(self, lesson_title: str, content: str) -> Dict[str, Any]:
        """
        Generates a structured lesson summary.
        Must return:
        {
            "summary": "High-level summary text...",
            "key_takeaways": ["Point 1", "Point 2", ...]
        }
        """
        pass

    @abstractmethod
    def generate_flashcards(self, lesson_title: str, content: str) -> Dict[str, Any]:
        """
        Generates structured flashcards.
        Must return:
        {
            "flashcards": [
                {"front": "Concept/Question", "back": "Explanation/Answer"},
                ...
            ]
        }
        """
        pass

    @abstractmethod
    def generate_mcqs(self, lesson_title: str, content: str) -> Dict[str, Any]:
        """
        Generates structured revision MCQs.
        Must return:
        {
            "mcqs": [
                {
                    "question": "Question text?",
                    "options": ["A", "B", "C", "D"],
                    "correct_index": 0,
                    "explanation": "Why this option is correct."
                },
                ...
            ]
        }
        """
        pass
