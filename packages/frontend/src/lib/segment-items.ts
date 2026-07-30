import type { WidgetSize } from './layout-store';

export interface SegmentItem {
  id: string;
}

export interface MasonrySegment {
  type: 'masonry';
  items: SegmentItem[];
}

export interface WideSegment {
  type: 'wide';
  items: [SegmentItem];
}

export type Segment = MasonrySegment | WideSegment;

export function segmentItems<T extends SegmentItem>(
  items: T[],
  sizes: Record<string, WidgetSize>,
): Segment[] {
  const segments: Segment[] = [];
  let currentCompact: T[] = [];

  for (const item of items) {
    if (sizes[item.id] === 'wide') {
      if (currentCompact.length > 0) {
        segments.push({ type: 'masonry', items: currentCompact });
        currentCompact = [];
      }
      segments.push({ type: 'wide', items: [item] });
    } else {
      currentCompact.push(item);
    }
  }

  if (currentCompact.length > 0) {
    segments.push({ type: 'masonry', items: currentCompact });
  }

  return segments;
}
