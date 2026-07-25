import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TTLCache } from '../src/cache.ts';

describe('TTLCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('stores and retrieves values within TTL', () => {
    const cache = new TTLCache<string>(60000);
    cache.set('key', 'value');
    expect(cache.get('key')).toBe('value');
  });

  it('returns null for expired entries', () => {
    const cache = new TTLCache<string>(1000);
    cache.set('key', 'value');
    vi.advanceTimersByTime(1500);
    expect(cache.get('key')).toBeNull();
  });

  it('has returns true for fresh entries', () => {
    const cache = new TTLCache<string>(60000);
    cache.set('key', 'value');
    expect(cache.has('key')).toBe(true);
  });

  it('deletes entries', () => {
    const cache = new TTLCache<string>(60000);
    cache.set('key', 'value');
    cache.delete('key');
    expect(cache.get('key')).toBeNull();
  });

  it('clears all entries', () => {
    const cache = new TTLCache<string>(60000);
    cache.set('a', '1');
    cache.set('b', '2');
    cache.clear();
    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).toBeNull();
  });

  it('accepts per-entry TTL override', () => {
    const cache = new TTLCache<string>(60000);
    cache.set('short', 'value', 500);
    vi.advanceTimersByTime(600);
    expect(cache.get('short')).toBeNull();
  });

  it('uses default TTL when no override given', () => {
    const cache = new TTLCache<string>(10000);
    cache.set('key', 'value');
    vi.advanceTimersByTime(9000);
    expect(cache.get('key')).toBe('value');
  });
});
