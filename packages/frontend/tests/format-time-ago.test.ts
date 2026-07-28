import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatTimeAgo } from '../src/lib/utils.ts';

describe('formatTimeAgo', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for <1 minute ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T12:00:30'));

    const thirtySecondsAgo = new Date('2026-07-28T12:00:00').toISOString();
    expect(formatTimeAgo(thirtySecondsAgo)).toBe('just now');
  });

  it('returns minutes ago for 1-59 minutes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T12:05:00'));

    const twoMinAgo = new Date('2026-07-28T12:03:00').toISOString();
    expect(formatTimeAgo(twoMinAgo)).toBe('2m ago');
  });

  it('returns hours ago for 1-23 hours', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T14:00:00'));

    const threeHoursAgo = new Date('2026-07-28T11:00:00').toISOString();
    expect(formatTimeAgo(threeHoursAgo)).toBe('3h ago');
  });

  it('returns days ago for 1+ days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-30T12:00:00'));

    const twoDaysAgo = new Date('2026-07-28T12:00:00').toISOString();
    expect(formatTimeAgo(twoDaysAgo)).toBe('2d ago');
  });

  it('returns "just now" for exact now', () => {
    vi.useFakeTimers();
    const now = new Date('2026-07-28T12:00:00');
    vi.setSystemTime(now);

    expect(formatTimeAgo(now.toISOString())).toBe('just now');
  });
});
