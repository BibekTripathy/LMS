import os
from django.conf import settings
from .base import BaseAIAdapter
from .mock_adapter import MockAIAdapter
from .gemini_adapter import GeminiAIAdapter

def get_ai_adapter() -> BaseAIAdapter:
    """
    Factory function to retrieve the configured AI provider adapter.
    
    Architecture:
    - Allows swapping the underlying AI provider (Mock, Gemini, etc.) via configuration
      without modifying core application or view logic.
    - Uses MockAIAdapter by default for local development and CI testing to prevent
      requiring API keys or incurring external API costs.
    - Set AI_PROVIDER=gemini in production along with AI_API_KEY / GEMINI_API_KEY.
    """
    provider = getattr(settings, 'AI_PROVIDER', os.getenv('AI_PROVIDER', 'mock')).lower()

    if provider == 'gemini':
        # Retrieve Gemini credentials and options from Django settings or environment
        api_key = getattr(settings, 'AI_API_KEY', os.getenv('AI_API_KEY', os.getenv('GEMINI_API_KEY', '')))
        model = getattr(settings, 'AI_MODEL', os.getenv('AI_MODEL', 'gemini-1.5-flash'))
        timeout = getattr(settings, 'AI_REQUEST_TIMEOUT', int(os.getenv('AI_REQUEST_TIMEOUT', '30')))
        return GeminiAIAdapter(api_key=api_key, model=model, timeout=timeout)

    # Default fallback: deterministic mock adapter for testing and offline development
    return MockAIAdapter()
