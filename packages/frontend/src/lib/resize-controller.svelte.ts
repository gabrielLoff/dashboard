import type { WidgetLayout } from './layout-store';
import { GRID_COLS, ROW_HEIGHT, MIN_COL_SPAN, MIN_ROW_SPAN } from './grid-engine';
import { checkCollision } from './grid-engine';

export interface ResizeState {
  resizeId: string | null;
  resizeEdge: 'right' | 'bottom' | 'corner';
  resizeStartX: number;
  resizeStartY: number;
  resizeOrigColSpan: number;
  resizeOrigRowSpan: number;
  resizePreviewColSpan: number;
  resizePreviewRowSpan: number;
}

export interface ResizeController {
  state: ResizeState;
  startResize(id: string): (e: PointerEvent, edge: 'right' | 'bottom' | 'corner') => void;
  handleResizeMove(e: PointerEvent): void;
  handleResizeEnd(): void;
  handleResizeKeyDown(e: KeyboardEvent): void;
}

export interface ResizeControllerDeps {
  getWidgets: () => Record<string, WidgetLayout>;
  gridWidthGetter: () => number;
  updatePosition: (widgetId: string, position: WidgetLayout) => void;
}

export function createResizeController(deps: ResizeControllerDeps): ResizeController {
  let resizeId: string | null = $state(null);
  let resizeEdge: 'right' | 'bottom' | 'corner' = $state('right');
  let resizeStartX = $state(0);
  let resizeStartY = $state(0);
  let resizeOrigColSpan = $state(0);
  let resizeOrigRowSpan = $state(0);
  let resizePreviewColSpan = $state(0);
  let resizePreviewRowSpan = $state(0);

  function handleResizeStart(e: PointerEvent, id: string, edge: 'right' | 'bottom' | 'corner') {
    e.preventDefault();
    const widgets = deps.getWidgets();
    const pos = widgets[id];
    if (!pos) return;

    e.stopPropagation();
    resizeId = id;
    resizeEdge = edge;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    resizeOrigColSpan = pos.colSpan;
    resizeOrigRowSpan = pos.rowSpan;
    resizePreviewColSpan = pos.colSpan;
    resizePreviewRowSpan = pos.rowSpan;

    document.addEventListener('pointermove', handleResizeMove);
    document.addEventListener('pointerup', handleResizeEnd);
    document.addEventListener('keydown', handleResizeKeyDown);
  }

  function handleResizeMove(e: PointerEvent) {
    if (!resizeId) return;

    const gridWidth = deps.gridWidthGetter();
    const colWidth = gridWidth / GRID_COLS;
    const dx = e.clientX - resizeStartX;
    const dy = e.clientY - resizeStartY;

    let newColSpan = resizeOrigColSpan;
    let newRowSpan = resizeOrigRowSpan;

    if (resizeEdge === 'right' || resizeEdge === 'corner') {
      newColSpan = Math.max(MIN_COL_SPAN, resizeOrigColSpan + Math.round(dx / colWidth));
    }
    if (resizeEdge === 'bottom' || resizeEdge === 'corner') {
      newRowSpan = Math.max(MIN_ROW_SPAN, resizeOrigRowSpan + Math.round(dy / ROW_HEIGHT));
    }

    const widgets = deps.getWidgets();
    const pos = widgets[resizeId];
    if (!pos) return;

    const candidate = { col: pos.col, row: pos.row, colSpan: newColSpan, rowSpan: newRowSpan };
    const otherWidgets = Object.entries(widgets)
      .filter(([id]) => id !== resizeId)
      .map(([, w]) => w);

    if (!otherWidgets.some((w) => checkCollision(candidate, w))) {
      resizePreviewColSpan = newColSpan;
      resizePreviewRowSpan = newRowSpan;
    }
  }

  function handleResizeEnd() {
    if (!resizeId) return;

    const widgets = deps.getWidgets();
    deps.updatePosition(resizeId, {
      col: widgets[resizeId]?.col ?? 0,
      row: widgets[resizeId]?.row ?? 0,
      colSpan: resizePreviewColSpan,
      rowSpan: resizePreviewRowSpan,
    });

    resizeId = null;
    document.removeEventListener('pointermove', handleResizeMove);
    document.removeEventListener('pointerup', handleResizeEnd);
    document.removeEventListener('keydown', handleResizeKeyDown);
  }

  function handleResizeKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && resizeId) {
      resizeId = null;
      document.removeEventListener('pointermove', handleResizeMove);
      document.removeEventListener('pointerup', handleResizeEnd);
      document.removeEventListener('keydown', handleResizeKeyDown);
    }
  }

  function startResize(id: string) {
    return (e: PointerEvent, edge: 'right' | 'bottom' | 'corner') => handleResizeStart(e, id, edge);
  }

  return {
    get state() {
      return {
        resizeId,
        resizeEdge,
        resizeStartX,
        resizeStartY,
        resizeOrigColSpan,
        resizeOrigRowSpan,
        resizePreviewColSpan,
        resizePreviewRowSpan,
      };
    },
    startResize,
    handleResizeMove,
    handleResizeEnd,
    handleResizeKeyDown,
  };
}
