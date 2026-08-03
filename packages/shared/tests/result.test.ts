import { describe, it, expect } from 'vitest';
import { ok, err, isOk, isErr, type ApiResult } from '../src/result.ts';

describe('Result type', () => {
  it('wraps success values', () => {
    const result: ApiResult<string> = ok('hello');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe('hello');
    }
  });

  it('wraps error values', () => {
    const result = err('something went wrong');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('something went wrong');
    }
  });

  it('isOk narrows type', () => {
    const result: ApiResult<number> = ok(42);
    if (isOk(result)) {
      expect(result.data).toBe(42);
    }
  });

  it('isErr narrows type', () => {
    const result = err('fail');
    if (isErr(result)) {
      expect(result.error).toBe('fail');
    }
  });
});
