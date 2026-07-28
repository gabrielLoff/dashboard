import { describe, it, expect } from 'vitest';

const INITIAL_LIMIT = 5;

function getVisibleItems<T>(items: T[], showAll: boolean): T[] {
  return showAll ? items : items.slice(0, INITIAL_LIMIT);
}

function hasMoreItems(items: T[]): boolean {
  return items.length > INITIAL_LIMIT;
}

describe('news toggle logic', () => {
  const items = Array.from({ length: 10 }, (_, i) => ({ id: String(i), title: `Item ${i}` }));

  it('shows first 5 items when collapsed', () => {
    const visible = getVisibleItems(items, false);
    expect(visible).toHaveLength(5);
    expect(visible[0].id).toBe('0');
    expect(visible[4].id).toBe('4');
  });

  it('shows all items when expanded', () => {
    const visible = getVisibleItems(items, true);
    expect(visible).toHaveLength(10);
  });

  it('hasMore returns true when more than 5 items', () => {
    expect(hasMoreItems(items)).toBe(true);
  });

  it('hasMore returns false when 5 or fewer items', () => {
    expect(hasMoreItems(items.slice(0, 5))).toBe(false);
    expect(hasMoreItems(items.slice(0, 3))).toBe(false);
  });

  it('hasMore returns false for empty array', () => {
    expect(hasMoreItems([])).toBe(false);
  });

  it('returns all items when 5 or fewer (no truncation needed)', () => {
    const fewItems = items.slice(0, 3);
    expect(getVisibleItems(fewItems, false)).toHaveLength(3);
    expect(getVisibleItems(fewItems, true)).toHaveLength(3);
  });
});
