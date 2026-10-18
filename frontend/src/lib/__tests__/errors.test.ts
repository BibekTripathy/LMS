import { describe, expect, it } from 'vitest';
import { getErrorCode, getErrorMessage } from '../errors';
import { apiError } from '../../test/render';

describe('getErrorMessage', () => {
  it('uses the backend error envelope', () => {
    expect(getErrorMessage(apiError(504, 'The AI provider did not respond in time.', 'AI_TIMEOUT'))).toBe(
      'The AI provider did not respond in time.'
    );
    expect(getErrorCode(apiError(504, 'x', 'AI_TIMEOUT'))).toBe('AI_TIMEOUT');
  });

  it('falls back to DRF detail and field errors', () => {
    const detail = { isAxiosError: true, response: { status: 403, data: { detail: 'Not allowed.' } } };
    const field = { isAxiosError: true, response: { status: 400, data: { options: ['Exactly one option must be marked correct.'] } } };
    expect(getErrorMessage(detail)).toBe('Not allowed.');
    expect(getErrorMessage(field)).toBe('Exactly one option must be marked correct.');
  });

  it('reports network failures and unknown values', () => {
    expect(getErrorMessage({ isAxiosError: true })).toMatch(/Cannot reach the server/);
    expect(getErrorMessage('weird', 'Fallback')).toBe('Fallback');
  });
});
