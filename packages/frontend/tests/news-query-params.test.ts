import { describe, it, expect } from 'vitest';
import { newsQueryParams } from '../src/lib/api-client.ts';

describe('newsQueryParams', () => {
  it('returns empty string when no filters', () => {
    expect(newsQueryParams()).toBe('');
  });

  it('returns empty string when filters object is empty', () => {
    expect(newsQueryParams({})).toBe('');
  });

  it('returns category only when no country', () => {
    expect(newsQueryParams({ category: 'technology' })).toBe('?category=technology');
  });

  it('returns country only when no category', () => {
    expect(newsQueryParams({ country: 'us' })).toBe('?country=us');
  });

  it('returns both country and category', () => {
    expect(newsQueryParams({ country: 'br', category: 'sports' })).toBe('?country=br&category=sports');
  });

  it('omits undefined country', () => {
    expect(newsQueryParams({ category: 'health' })).toBe('?category=health');
  });

  it('omits undefined category', () => {
    expect(newsQueryParams({ country: 'it' })).toBe('?country=it');
  });

  it('handles all valid categories', () => {
    const categories = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];
    for (const cat of categories) {
      expect(newsQueryParams({ category: cat })).toBe(`?category=${cat}`);
    }
  });

  it('handles all valid countries', () => {
    const countries = ['us', 'br', 'it'];
    for (const c of countries) {
      expect(newsQueryParams({ country: c })).toBe(`?country=${c}`);
    }
  });
});
