import type { WidgetLayout } from './layout-store';
import { WIDGET_IDS } from './layout-store';

export const GRID_COLS = 6;
export const ROW_HEIGHT = 120;
export const MIN_COL_SPAN = 2;
export const MIN_ROW_SPAN = 2;

export function snapToGrid(
  col: number,
  row: number,
  colSpan: number,
  rowSpan: number,
): WidgetLayout {
  return {
    col: Math.max(0, Math.round(col)),
    row: Math.max(0, Math.round(row)),
    colSpan: Math.max(MIN_COL_SPAN, Math.round(colSpan)),
    rowSpan: Math.max(MIN_ROW_SPAN, Math.round(rowSpan)),
  };
}

export function checkCollision(a: WidgetLayout, b: WidgetLayout): boolean {
  return (
    a.col < b.col + b.colSpan &&
    a.col + a.colSpan > b.col &&
    a.row < b.row + b.rowSpan &&
    a.row + a.rowSpan > b.row
  );
}

export function isWithinBounds(widget: WidgetLayout, gridCols: number = GRID_COLS): boolean {
  return (
    widget.col >= 0 &&
    widget.row >= 0 &&
    widget.col + widget.colSpan <= gridCols
  );
}

export function getGridDimensions(widgets: WidgetLayout[]): number {
  if (widgets.length === 0) return 0;
  return Math.max(...widgets.map((w) => w.row + w.rowSpan));
}

export function computeMobileOrder(
  widgets: Record<string, WidgetLayout>,
  order?: string[],
): string[] {
  const ids = Object.keys(widgets);
  if (ids.length === 0) {
    return order ? [...order] : [...WIDGET_IDS];
  }

  const fallbackOrder = order ?? ids;
  const indexMap = new Map(fallbackOrder.map((id, i) => [id, i]));

  return [...ids].sort((a, b) => {
    const wa = widgets[a];
    const wb = widgets[b];
    if (!wa || !wb) return 0;
    if (wa.row !== wb.row) return wa.row - wb.row;
    if (wa.col !== wb.col) return wa.col - wb.col;
    return (indexMap.get(a) ?? 0) - (indexMap.get(b) ?? 0);
  });
}

export function findNearestFreePosition(
  target: WidgetLayout,
  existing: WidgetLayout[],
  gridCols: number = GRID_COLS,
): WidgetLayout {
  if (existing.length === 0 && isWithinBounds(target, gridCols)) {
    return { ...target };
  }

  const maxRow = getGridDimensions(existing) + target.rowSpan + 10;

  for (let row = target.row; row <= maxRow; row++) {
    for (let col = target.col; col <= gridCols - target.colSpan; col++) {
      const candidate: WidgetLayout = { col, row, colSpan: target.colSpan, rowSpan: target.rowSpan };
      if (isWithinBounds(candidate, gridCols) && !existing.some((e) => checkCollision(candidate, e))) {
        return candidate;
      }
    }
  }

  for (let row = 0; row <= maxRow; row++) {
    for (let col = 0; col <= gridCols - target.colSpan; col++) {
      const candidate: WidgetLayout = { col, row, colSpan: target.colSpan, rowSpan: target.rowSpan };
      if (isWithinBounds(candidate, gridCols) && !existing.some((e) => checkCollision(candidate, e))) {
        return candidate;
      }
    }
  }

  return { col: 0, row: 0, colSpan: target.colSpan, rowSpan: target.rowSpan };
}
