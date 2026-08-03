import { describe, it, expect } from 'vitest';
import type { WidgetLayout } from '../src/lib/layout-store';
import { computeResponsivePositions } from '../src/lib/responsive-layout';

function w(col: number, row: number, colSpan: number, rowSpan: number): WidgetLayout {
  return { col, row, colSpan, rowSpan };
}

describe('responsive-layout', () => {
  const widgets: Record<string, WidgetLayout> = {
    weather: w(0, 0, 3, 3),
    habits: w(3, 0, 3, 2),
    news: w(0, 3, 2, 4),
    games: w(2, 3, 3, 4),
    agenda: w(5, 2, 1, 5),
    shows: w(3, 5, 3, 3),
  };
  const order = ['weather', 'habits', 'news', 'games', 'agenda', 'shows'];

  describe('desktop', () => {
    it('returns positions unchanged from widget layout', () => {
      const result = computeResponsivePositions(widgets, order, 'desktop');
      expect(result['weather']).toEqual({ col: 0, row: 0, colSpan: 3, rowSpan: 3 });
      expect(result['habits']).toEqual({ col: 3, row: 0, colSpan: 3, rowSpan: 2 });
      expect(result['news']).toEqual({ col: 0, row: 3, colSpan: 2, rowSpan: 4 });
    });

    it('preserves all widgets in order', () => {
      const result = computeResponsivePositions(widgets, order, 'desktop');
      expect(Object.keys(result)).toEqual(order);
    });
  });

  describe('mobile', () => {
    it('stacks all widgets in single column', () => {
      const result = computeResponsivePositions(widgets, order, 'mobile');
      for (const pos of Object.values(result)) {
        expect(pos.col).toBe(0);
        expect(pos.colSpan).toBe(1);
        expect(pos.rowSpan).toBe(1);
      }
    });

    it('orders widgets by row then col from original layout', () => {
      const result = computeResponsivePositions(widgets, order, 'mobile');
      const ids = Object.keys(result);
      expect(ids[0]).toBe('weather');
      expect(ids[1]).toBe('habits');
    });

    it('assigns sequential rows', () => {
      const result = computeResponsivePositions(widgets, order, 'mobile');
      const rows = Object.values(result).map((p) => p.row);
      expect(rows).toEqual([0, 1, 2, 3, 4, 5]);
    });
  });

  describe('tablet', () => {
    it('uses 2-column layout', () => {
      const result = computeResponsivePositions(widgets, order, 'tablet');
      for (const pos of Object.values(result)) {
        expect(pos.col).toBeLessThan(2);
        expect(pos.col + pos.colSpan).toBeLessThanOrEqual(2);
      }
    });

    it('caps colSpan at 2', () => {
      const wideWidgets: Record<string, WidgetLayout> = {
        a: w(0, 0, 6, 3),
        b: w(0, 3, 4, 2),
      };
      const wideOrder = ['a', 'b'];
      const result = computeResponsivePositions(wideWidgets, wideOrder, 'tablet');
      expect(result['a']!.colSpan).toBe(2);
      expect(result['b']!.colSpan).toBe(2);
    });

    it('wraps to next row when widget would exceed 2 columns', () => {
      const result = computeResponsivePositions(widgets, order, 'tablet');
      const rows = Object.values(result).map((p) => p.row);
      const maxCol = Math.max(...Object.values(result).map((p) => p.col + p.colSpan));
      expect(maxCol).toBeLessThanOrEqual(2);
    });

    it('uses mobile ordering (by row then col)', () => {
      const result = computeResponsivePositions(widgets, order, 'tablet');
      const ids = Object.keys(result);
      expect(ids[0]).toBe('weather');
      expect(ids[1]).toBe('habits');
    });
  });
});
