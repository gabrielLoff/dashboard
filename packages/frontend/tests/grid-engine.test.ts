import { describe, it, expect } from 'vitest';
import type { WidgetLayout } from '../src/lib/layout-store';
import {
  snapToGrid,
  checkCollision,
  findNearestFreePosition,
  isWithinBounds,
  getGridDimensions,
  computeMobileOrder,
} from '../src/lib/grid-engine';

function w(col: number, row: number, colSpan: number, rowSpan: number): WidgetLayout {
  return { col, row, colSpan, rowSpan };
}

describe('grid-engine', () => {
  describe('snapToGrid', () => {
    it('snaps fractional col to nearest integer', () => {
      expect(snapToGrid(1.7, 0, 2, 2)).toEqual({ col: 2, row: 0, colSpan: 2, rowSpan: 2 });
    });

    it('snaps fractional row to nearest integer', () => {
      expect(snapToGrid(0, 3.2, 2, 2)).toEqual({ col: 0, row: 3, colSpan: 2, rowSpan: 2 });
    });

    it('snaps fractional colSpan up to minimum', () => {
      expect(snapToGrid(0, 0, 1.3, 2)).toEqual({ col: 0, row: 0, colSpan: 2, rowSpan: 2 });
    });

    it('snaps fractional rowSpan up to minimum', () => {
      expect(snapToGrid(0, 0, 2, 1.1)).toEqual({ col: 0, row: 0, colSpan: 2, rowSpan: 2 });
    });

    it('enforces minimum colSpan of 2', () => {
      expect(snapToGrid(0, 0, 1, 2)).toEqual({ col: 0, row: 0, colSpan: 2, rowSpan: 2 });
    });

    it('enforces minimum rowSpan of 2', () => {
      expect(snapToGrid(0, 0, 2, 1)).toEqual({ col: 0, row: 0, colSpan: 2, rowSpan: 2 });
    });

    it('clamps negative col to 0', () => {
      expect(snapToGrid(-1, 0, 2, 2)).toEqual({ col: 0, row: 0, colSpan: 2, rowSpan: 2 });
    });

    it('clamps negative row to 0', () => {
      expect(snapToGrid(0, -1, 2, 2)).toEqual({ col: 0, row: 0, colSpan: 2, rowSpan: 2 });
    });

    it('does not change already valid values', () => {
      expect(snapToGrid(2, 3, 3, 2)).toEqual({ col: 2, row: 3, colSpan: 3, rowSpan: 2 });
    });
  });

  describe('checkCollision', () => {
    it('returns true for overlapping widgets', () => {
      expect(checkCollision(w(0, 0, 3, 3), w(2, 2, 3, 3))).toBe(true);
    });

    it('returns false for adjacent widgets (no overlap)', () => {
      expect(checkCollision(w(0, 0, 3, 3), w(3, 0, 3, 3))).toBe(false);
    });

    it('returns false for widgets in different rows', () => {
      expect(checkCollision(w(0, 0, 3, 2), w(0, 2, 3, 2))).toBe(false);
    });

    it('returns true for identical positions', () => {
      expect(checkCollision(w(0, 0, 3, 3), w(0, 0, 3, 3))).toBe(true);
    });

    it('returns true for partial horizontal overlap', () => {
      expect(checkCollision(w(0, 0, 4, 2), w(2, 0, 4, 2))).toBe(true);
    });

    it('returns true for partial vertical overlap', () => {
      expect(checkCollision(w(0, 0, 2, 4), w(0, 2, 2, 4))).toBe(true);
    });

    it('returns false for widgets that barely miss', () => {
      expect(checkCollision(w(0, 0, 2, 2), w(2, 2, 2, 2))).toBe(false);
    });

    it('returns true when one widget fully contains another', () => {
      expect(checkCollision(w(0, 0, 6, 6), w(1, 1, 2, 2))).toBe(true);
    });
  });

  describe('isWithinBounds', () => {
    it('returns true for valid position', () => {
      expect(isWithinBounds(w(0, 0, 3, 3))).toBe(true);
    });

    it('returns true for widget at grid edge', () => {
      expect(isWithinBounds(w(4, 0, 2, 2))).toBe(true);
    });

    it('returns false for negative col', () => {
      expect(isWithinBounds(w(-1, 0, 2, 2))).toBe(false);
    });

    it('returns false for negative row', () => {
      expect(isWithinBounds(w(0, -1, 2, 2))).toBe(false);
    });

    it('returns false when col + colSpan exceeds gridCols', () => {
      expect(isWithinBounds(w(5, 0, 2, 2))).toBe(false);
    });

    it('returns false when col + colSpan exceeds default 6', () => {
      expect(isWithinBounds(w(4, 0, 3, 2))).toBe(false);
    });

    it('returns true with custom gridCols', () => {
      expect(isWithinBounds(w(8, 0, 2, 2), 10)).toBe(true);
    });

    it('returns false with custom gridCols exceeded', () => {
      expect(isWithinBounds(w(8, 0, 3, 2), 10)).toBe(false);
    });
  });

  describe('getGridDimensions', () => {
    it('returns 0 for empty array', () => {
      expect(getGridDimensions([])).toBe(0);
    });

    it('returns rowSpan for single widget at row 0', () => {
      expect(getGridDimensions([w(0, 0, 3, 3)])).toBe(3);
    });

    it('returns row + rowSpan for single widget not at row 0', () => {
      expect(getGridDimensions([w(0, 5, 3, 3)])).toBe(8);
    });

    it('returns max rows across multiple widgets', () => {
      expect(getGridDimensions([
        w(0, 0, 3, 3),
        w(3, 0, 3, 2),
        w(0, 3, 6, 4),
      ])).toBe(7);
    });

    it('handles overlapping row ranges', () => {
      expect(getGridDimensions([
        w(0, 0, 3, 5),
        w(3, 2, 3, 3),
      ])).toBe(5);
    });
  });

  describe('computeMobileOrder', () => {
    const widgets: Record<string, WidgetLayout> = {
      weather: w(0, 0, 3, 3),
      news: w(0, 3, 2, 4),
      agenda: w(5, 2, 1, 5),
      games: w(2, 3, 3, 4),
      shows: w(3, 5, 3, 3),
      habits: w(3, 0, 3, 2),
    };

    it('sorts widgets by row then col', () => {
      const order = computeMobileOrder(widgets);
      expect(order).toEqual(['weather', 'habits', 'agenda', 'news', 'games', 'shows']);
    });

    it('falls back to provided order for widgets with same row and col', () => {
      const tied: Record<string, WidgetLayout> = {
        a: w(0, 0, 2, 2),
        b: w(0, 0, 2, 2),
      };
      const order = computeMobileOrder(tied, ['b', 'a']);
      expect(order).toEqual(['b', 'a']);
    });

    it('returns default order for empty widgets', () => {
      expect(computeMobileOrder({})).toEqual(['weather', 'news', 'agenda', 'games', 'shows', 'habits']);
    });

    it('uses default WIDGET_IDS order as fallback', () => {
      const empty: Record<string, WidgetLayout> = {};
      const order = computeMobileOrder(empty);
      expect(order).toEqual(['weather', 'news', 'agenda', 'games', 'shows', 'habits']);
    });
  });

  describe('findNearestFreePosition', () => {
    it('returns target position when no collisions', () => {
      const target = w(0, 0, 3, 3);
      const result = findNearestFreePosition(target, []);
      expect(result).toEqual({ col: 0, row: 0, colSpan: 3, rowSpan: 3 });
    });

    it('returns target when target does not overlap existing', () => {
      const target = w(4, 0, 2, 2);
      const existing = [w(0, 0, 3, 3)];
      const result = findNearestFreePosition(target, existing);
      expect(result).toEqual({ col: 4, row: 0, colSpan: 2, rowSpan: 2 });
    });

    it('finds position to the right when target overlaps', () => {
      const target = w(0, 0, 3, 3);
      const existing = [w(0, 0, 3, 3)];
      const result = findNearestFreePosition(target, existing);
      expect(result.col).toBeGreaterThanOrEqual(3);
      expect(result.colSpan).toBe(3);
      expect(result.rowSpan).toBe(3);
    });

    it('finds position below when right is blocked', () => {
      const target = w(0, 0, 3, 3);
      const existing = [
        w(0, 0, 3, 3),
        w(3, 0, 3, 3),
      ];
      const result = findNearestFreePosition(target, existing);
      expect(result.row).toBeGreaterThanOrEqual(3);
    });

    it('result does not collide with any existing widget', () => {
      const target = w(0, 0, 3, 3);
      const existing = [
        w(0, 0, 3, 3),
        w(3, 0, 3, 3),
        w(0, 3, 6, 2),
      ];
      const result = findNearestFreePosition(target, existing);
      for (const e of existing) {
        expect(checkCollision(result, e)).toBe(false);
      }
    });

    it('result is within bounds', () => {
      const target = w(0, 0, 3, 3);
      const existing = [w(0, 0, 6, 2)];
      const result = findNearestFreePosition(target, existing);
      expect(isWithinBounds(result)).toBe(true);
    });

    it('preserves colSpan and rowSpan of target', () => {
      const target = w(0, 0, 4, 3);
      const existing = [w(0, 0, 6, 2)];
      const result = findNearestFreePosition(target, existing);
      expect(result.colSpan).toBe(4);
      expect(result.rowSpan).toBe(3);
    });

    it('handles full grid scenario', () => {
      const target = w(0, 0, 3, 3);
      const existing = [
        w(0, 0, 3, 2),
        w(3, 0, 3, 2),
        w(0, 2, 2, 2),
        w(2, 2, 2, 2),
        w(4, 2, 2, 2),
      ];
      const result = findNearestFreePosition(target, existing);
      expect(isWithinBounds(result)).toBe(true);
      for (const e of existing) {
        expect(checkCollision(result, e)).toBe(false);
      }
    });
  });
});
