import { describe, it, expect } from 'vitest';
import { getReadingTime } from '../src/lib/utils';

describe('getReadingTime', () => {
  it('returns 1 for empty string', () => {
    expect(getReadingTime('')).toBe(1);
  });

  it('returns 1 for short text (under 200 words)', () => {
    expect(getReadingTime('Hello world')).toBe(1);
  });

  it('returns 1 for exactly 200 words', () => {
    const text = Array(200).fill('word').join(' ');
    expect(getReadingTime(text)).toBe(1);
  });

  it('returns 2 for 201-400 words', () => {
    const text = Array(250).fill('word').join(' ');
    expect(getReadingTime(text)).toBe(2);
  });

  it('returns 3 for 401-600 words', () => {
    const text = Array(500).fill('word').join(' ');
    expect(getReadingTime(text)).toBe(3);
  });

  it('handles multiple spaces between words', () => {
    const text = Array(250).fill('word').join('   ');
    expect(getReadingTime(text)).toBe(2);
  });

  it('handles leading/trailing whitespace', () => {
    const text = `  ${Array(250).fill('word').join(' ')}  `;
    expect(getReadingTime(text)).toBe(2);
  });

  it('returns 1 for whitespace-only string', () => {
    expect(getReadingTime('   ')).toBe(1);
  });
});
