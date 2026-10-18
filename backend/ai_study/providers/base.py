"""
Provider adapter interface for AI study-resource generation.

Application code depends only on `AIProvider.generate_json` and the error
classes below, so the hosted model can be swapped by configuration
(`AI_PROVIDER`) without touching services or views.
"""
from abc import ABC, abstractmethod
from typing import Any, Optional


class AIError(Exception):
    """Base class for AI failures. `message` is safe to show to API clients."""
    code = 'AI_PROVIDER_ERROR'
    http_status = 502
    retryable = False

    def __init__(self, message: str = 'The AI provider returned an error.', retry_after: Optional[int] = None):
        super().__init__(message)
        self.message = message
        self.retry_after = retry_after


class AIConfigurationError(AIError):
    code = 'AI_NOT_CONFIGURED'
    http_status = 503


class AITimeoutError(AIError):
    code = 'AI_TIMEOUT'
    http_status = 504
    retryable = True


class AIRateLimitError(AIError):
    """Short-term provider rate limit (e.g. requests per minute)."""
    code = 'AI_RATE_LIMITED'
    http_status = 503
    retryable = True


class AIQuotaExhaustedError(AIError):
    """Long-term quota (e.g. requests per day) is used up; retrying will not help."""
    code = 'AI_QUOTA_EXHAUSTED'
    http_status = 503


class AIProviderError(AIError):
    code = 'AI_PROVIDER_ERROR'
    http_status = 502


class AITransientProviderError(AIProviderError):
    """5xx / network failures that may succeed on retry."""
    retryable = True


class AIInvalidOutputError(AIError):
    """The model answered, but not with valid JSON matching the requested schema."""
    code = 'AI_INVALID_OUTPUT'
    http_status = 502


class AIProvider(ABC):
    name = 'base'

    @abstractmethod
    def generate_json(self, *, task: str, system_instruction: str, prompt: str, max_output_tokens: int) -> Any:
        """
        Run one generation and return the parsed JSON value.

        `task` identifies the prompt family (mcq, flashcards, summary, revision).
        Raises an `AIError` subclass on any failure; never returns raw text.
        """
