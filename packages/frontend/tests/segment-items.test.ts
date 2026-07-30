import { describe, it, expect } from 'vitest';
import { segmentItems, type SegmentItem } from '../src/lib/segment-items';
import type { WidgetSize } from '../src/lib/layout-store';

function item(id: string): SegmentItem {
  return { id };
}

describe('segmentItems', () => {
  it('returns single masonry segment for all compact items', () => {
    const items = [item('a'), item('b'), item('c')];
    const result = segmentItems(items, {});

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ type: 'masonry', items });
  });

  it('returns wide segments for all wide items', () => {
    const items = [item('a'), item('b'), item('c')];
    const result = segmentItems(items, { a: 'wide', b: 'wide', c: 'wide' });

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ type: 'wide', items: [item('a')] });
    expect(result[1]).toEqual({ type: 'wide', items: [item('b')] });
    expect(result[2]).toEqual({ type: 'wide', items: [item('c')] });
  });

  it('splits mixed order into correct segments', () => {
    const items = [item('a'), item('b'), item('c'), item('d'), item('e')];
    const result = segmentItems(items, { c: 'wide' });

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ type: 'masonry', items: [item('a'), item('b')] });
    expect(result[1]).toEqual({ type: 'wide', items: [item('c')] });
    expect(result[2]).toEqual({ type: 'masonry', items: [item('d'), item('e')] });
  });

  it('handles wide item at the start', () => {
    const items = [item('a'), item('b'), item('c')];
    const result = segmentItems(items, { a: 'wide' });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ type: 'wide', items: [item('a')] });
    expect(result[1]).toEqual({ type: 'masonry', items: [item('b'), item('c')] });
  });

  it('handles wide item at the end', () => {
    const items = [item('a'), item('b'), item('c')];
    const result = segmentItems(items, { c: 'wide' });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ type: 'masonry', items: [item('a'), item('b')] });
    expect(result[1]).toEqual({ type: 'wide', items: [item('c')] });
  });

  it('handles consecutive wide items', () => {
    const items = [item('a'), item('b'), item('c')];
    const result = segmentItems(items, { a: 'wide', b: 'wide' });

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ type: 'wide', items: [item('a')] });
    expect(result[1]).toEqual({ type: 'wide', items: [item('b')] });
    expect(result[2]).toEqual({ type: 'masonry', items: [item('c')] });
  });

  it('handles empty items array', () => {
    const result = segmentItems([], {});
    expect(result).toHaveLength(0);
  });

  it('handles items with no size entry (defaults to compact)', () => {
    const items = [item('a'), item('b')];
    const result = segmentItems(items, {});

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ type: 'masonry', items });
  });
});
