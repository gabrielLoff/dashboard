import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatRelativeDate } from '../src/lib/utils.ts';

describe('formatRelativeDate', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Today —" prefix for today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T12:00:00'));

    const result = formatRelativeDate('2026-07-28');
    expect(result).toMatch(/^Today — /);
  });

  it('returns "Tomorrow —" prefix for tomorrow', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T12:00:00'));

    const result = formatRelativeDate('2026-07-29');
    expect(result).toMatch(/^Tomorrow — /);
  });

  it('returns formatted date for other days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T12:00:00'));

    const result = formatRelativeDate('2026-07-30');
    expect(result).not.toMatch(/^Today/);
    expect(result).not.toMatch(/^Tomorrow/);
    expect(result).toContain('Jul 30');
  });

  it('returns formatted date for past days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T12:00:00'));

    const result = formatRelativeDate('2026-07-27');
    expect(result).not.toMatch(/^Today/);
    expect(result).not.toMatch(/^Tomorrow/);
    expect(result).toContain('Jul 27');
  });

  it('includes weekday in output', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T12:00:00'));

    const result = formatRelativeDate('2026-07-30');
    expect(result).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/);
  });
});
