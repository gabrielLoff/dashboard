import type { WidgetLayout } from './layout-store';
import { computeMobileOrder } from './grid-engine';

export function computeResponsivePositions(
  widgets: Record<string, WidgetLayout>,
  order: string[],
  bp: 'mobile' | 'tablet' | 'desktop',
): Record<string, { col: number; row: number; colSpan: number; rowSpan: number }> {
  if (bp === 'desktop') {
    const result: Record<string, { col: number; row: number; colSpan: number; rowSpan: number }> = {};
    for (const id of order) {
      const w = widgets[id];
      if (w) result[id] = { col: w.col, row: w.row, colSpan: w.colSpan, rowSpan: w.rowSpan };
    }
    return result;
  }

  if (bp === 'mobile') {
    const sorted = computeMobileOrder(widgets, order);
    const result: Record<string, { col: number; row: number; colSpan: number; rowSpan: number }> = {};
    let row = 0;
    for (const id of sorted) {
      result[id] = { col: 0, row, colSpan: 1, rowSpan: 1 };
      row += 1;
    }
    return result;
  }

  const tabletOrder = computeMobileOrder(widgets, order);
  const result: Record<string, { col: number; row: number; colSpan: number; rowSpan: number }> = {};
  let row = 0;
  let col = 0;
  for (const id of tabletOrder) {
    const w = widgets[id];
    const span = w ? Math.min(w.colSpan, 2) : 1;
    if (col + span > 2) {
      row += 1;
      col = 0;
    }
    result[id] = { col, row, colSpan: span, rowSpan: 1 };
    col += span;
  }
  return result;
}
