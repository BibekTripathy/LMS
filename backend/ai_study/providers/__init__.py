from django.conf import settings

from .base import AIConfigurationError, AIProvider


def get_provider() -> AIProvider:
    """Return the provider selected by the AI_PROVIDER setting."""
    name = (settings.AI_PROVIDER or '').strip().lower()

    if name == 'gemini':
        from .gemini import GeminiProvider
        return GeminiProvider(
            api_key=settings.GEMINI_API_KEY,
            model=settings.AI_MODEL,
            timeout=settings.AI_REQUEST_TIMEOUT,
            max_retries=settings.AI_MAX_RETRIES,
            max_retry_wait=settings.AI_MAX_RETRY_WAIT,
        )
    if name == 'mock':
        from .mock import MockProvider
        return MockProvider()

    raise AIConfigurationError('AI generation is not configured on this server.')
