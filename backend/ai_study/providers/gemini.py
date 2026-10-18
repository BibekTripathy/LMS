"""
Gemini Developer API adapter (free tier), called with httpx.

- The API key travels in the `x-goog-api-key` header, never in the URL, so it
  cannot leak into proxy or access logs.
- Retries are limited to `max_retries` and only for transient failures
  (timeouts, 5xx, short rate limits whose RetryInfo delay fits `max_retry_wait`).
- Daily quota exhaustion is detected from QuotaFailure details and not retried.
- Provider error bodies are never echoed to API clients.
"""
import json
import logging
import re
import time
from typing import Any, Callable, Optional

import httpx

from .base import (
    AIConfigurationError,
    AIError,
    AIInvalidOutputError,
    AIProvider,
    AIProviderError,
    AIQuotaExhaustedError,
    AIRateLimitError,
    AITimeoutError,
    AITransientProviderError,
)

logger = logging.getLogger(__name__)

GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'
_FENCE_RE = re.compile(r'^\s*```(?:json)?\s*(.*?)\s*```\s*$', re.DOTALL)


def parse_json_text(text: str) -> Any:
    """Parse model text as JSON, tolerating a single surrounding ``` fence."""
    if not isinstance(text, str) or not text.strip():
        raise AIInvalidOutputError('The AI provider returned an empty response.')
    match = _FENCE_RE.match(text)
    if match:
        text = match.group(1)
    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError):
        raise AIInvalidOutputError('The AI provider returned malformed JSON.')


def _parse_retry_delay(value: Any) -> Optional[int]:
    # RetryInfo.retryDelay is a protobuf Duration string such as "36s" or "1.5s".
    if isinstance(value, str) and value.endswith('s'):
        try:
            return max(1, int(float(value[:-1]) + 0.999))
        except ValueError:
            return None
    return None


class GeminiProvider(AIProvider):
    name = 'gemini'

    def __init__(
        self,
        api_key: str,
        model: str,
        timeout: float = 30.0,
        max_retries: int = 2,
        max_retry_wait: float = 10.0,
        transport: Optional[httpx.BaseTransport] = None,
        sleep: Callable[[float], None] = time.sleep,
    ):
        if not api_key:
            raise AIConfigurationError('AI generation is not configured on this server.')
        if not model:
            raise AIConfigurationError('AI generation is not configured on this server.')
        self.api_key = api_key
        self.model = model
        self.timeout = timeout
        self.max_retries = max(0, int(max_retries))
        self.max_retry_wait = max_retry_wait
        self.transport = transport
        self.sleep = sleep

    @property
    def url(self) -> str:
        return f'{GEMINI_BASE_URL}/models/{self.model}:generateContent'

    def generate_json(self, *, task: str, system_instruction: str, prompt: str, max_output_tokens: int) -> Any:
        payload = {
            'systemInstruction': {'parts': [{'text': system_instruction}]},
            'contents': [{'role': 'user', 'parts': [{'text': prompt}]}],
            'generationConfig': {
                'responseMimeType': 'application/json',
                'temperature': 0.2,
                'maxOutputTokens': max_output_tokens,
            },
        }
        text = self._post_with_retries(task, payload)
        return parse_json_text(text)

    def _post_with_retries(self, task: str, payload: dict) -> str:
        attempt = 0
        while True:
            try:
                return self._post_once(payload)
            except AIError as exc:
                wait = self._retry_wait(exc, attempt)
                if wait is None:
                    logger.warning('Gemini %s failed: %s (%s)', task, exc.code, type(exc).__name__)
                    raise
                attempt += 1
                logger.info('Gemini %s retry %d/%d after %s in %.1fs', task, attempt, self.max_retries, exc.code, wait)
                self.sleep(wait)

    def _retry_wait(self, exc: AIError, attempt: int) -> Optional[float]:
        if not exc.retryable or attempt >= self.max_retries:
            return None
        backoff = float(2 ** attempt)
        if exc.retry_after is not None:
            if exc.retry_after > self.max_retry_wait:
                return None  # Waiting that long inside a request is worse than failing fast.
            return float(exc.retry_after)
        return min(backoff, self.max_retry_wait)

    def _post_once(self, payload: dict) -> str:
        headers = {'x-goog-api-key': self.api_key, 'Content-Type': 'application/json'}
        try:
            with httpx.Client(timeout=self.timeout, transport=self.transport) as client:
                response = client.post(self.url, json=payload, headers=headers)
        except httpx.TimeoutException:
            raise AITimeoutError('The AI provider did not respond in time.')
        except httpx.HTTPError:
            raise AITransientProviderError('Could not reach the AI provider.')

        if response.status_code == 200:
            return self._extract_text(response)
        raise self._error_for(response)

    def _extract_text(self, response: httpx.Response) -> str:
        try:
            body = response.json()
        except ValueError:
            raise AIProviderError('The AI provider returned an unreadable response.')

        block_reason = (body.get('promptFeedback') or {}).get('blockReason')
        if block_reason:
            raise AIProviderError('The AI provider declined to process this material.')

        candidates = body.get('candidates') or []
        if not candidates:
            raise AIInvalidOutputError('The AI provider returned no content.')
        candidate = candidates[0]
        finish = candidate.get('finishReason')
        if finish == 'MAX_TOKENS':
            raise AIInvalidOutputError('The AI response exceeded the output size limit.')
        if finish in ('SAFETY', 'RECITATION', 'BLOCKLIST', 'PROHIBITED_CONTENT'):
            raise AIProviderError('The AI provider declined to process this material.')

        parts = (candidate.get('content') or {}).get('parts') or []
        text = ''.join(p.get('text', '') for p in parts if isinstance(p, dict))
        return text

    def _error_for(self, response: httpx.Response) -> AIError:
        status = response.status_code
        try:
            error = response.json().get('error') or {}
        except (ValueError, AttributeError):
            error = {}

        if status == 429:
            retry_after = None
            daily = False
            for detail in error.get('details') or []:
                kind = detail.get('@type', '')
                if kind.endswith('RetryInfo'):
                    retry_after = _parse_retry_delay(detail.get('retryDelay'))
                if kind.endswith('QuotaFailure'):
                    for violation in detail.get('violations') or []:
                        if 'PerDay' in str(violation.get('quotaId', '')):
                            daily = True
            if daily:
                return AIQuotaExhaustedError('The AI provider quota for today is used up. Please try again later.')
            return AIRateLimitError('The AI provider is rate limiting requests. Please try again shortly.', retry_after=retry_after)

        if status in (401, 403):
            logger.error('Gemini rejected the configured credentials (HTTP %s).', status)
            return AIConfigurationError('AI generation is not configured on this server.')
        if status == 404:
            logger.error('Gemini model %r was not found.', self.model)
            return AIConfigurationError('AI generation is not configured on this server.')
        if status >= 500:
            return AITransientProviderError('The AI provider is temporarily unavailable.')
        return AIProviderError('The AI provider rejected the request.')
