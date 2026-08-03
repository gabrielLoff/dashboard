import { snapToGrid, findNearestFreePosition, GRID_COLS, ROW_HEIGHT } from './grid-engine';
import { layoutStore } from './layout-store';
import type { WidgetLayout } from './layout-store';

export interface DragState {
  dragId: string | null;
  ghostCol: number;
  ghostRow: number;
  ghostColSpan: number;
  ghostRowSpan: number;
  offsetX: number;
  offsetY: number;
  gridWidth: number;
}

export interface DragController {
  state: DragState;
  startDrag(id: string): (e: PointerEvent) => void;
}

interface DragControllerDeps {
  getWidgets: () => Record<string, WidgetLayout>;
}

export function createDragController(
  deps: DragControllerDeps,
  gridElGetter: () => HTMLElement | undefined,
): DragController {
  let dragId: string | null = $state(null);
  let ghostCol = $state(0);
  let ghostRow = $state(0);
  let ghostColSpan = $state(0);
  let ghostRowSpan = $state(0);
  let offsetX = $state(0);
  let offsetY = $state(0);
  let gridWidth = $state(0);

  function handlePointerMove(e: PointerEvent) {
    if (!dragId) return;
    const gridEl = gridElGetter();
    if (!gridEl) return;

    const rect = gridEl.getBoundingClientRect();
    const colWidth = gridWidth / GRID_COLS;
    const rawCol = (e.clientX - rect.left - offsetX) / colWidth;
    const rawRow = (e.clientY - rect.top - offsetY) / ROW_HEIGHT;

    const snapped = snapToGrid(rawCol, rawRow, ghostColSpan, ghostRowSpan);

    const otherWidgets = Object.entries(deps.getWidgets())
      .filter(([id]) => id !== dragId)
      .map(([, w]) => w);

    const nearest = findNearestFreePosition(snapped, otherWidgets);
    ghostCol = nearest.col;
    ghostRow = nearest.row;
  }

  function handlePointerUp() {
    if (!dragId) return;

    layoutStore.updatePosition(dragId, {
      col: ghostCol,
      row: ghostRow,
      colSpan: ghostColSpan,
      rowSpan: ghostRowSpan,
    });

    dragId = null;
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
    document.removeEventListener('keydown', handleKeyDown);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && dragId) {
      dragId = null;
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('keydown', handleKeyDown);
    }
  }

  return {
    get state() {
      return {
        dragId,
        ghostCol,
        ghostRow,
        ghostColSpan,
        ghostRowSpan,
        offsetX,
        offsetY,
        gridWidth,
      };
    },

    startDrag(id: string) {
      return (e: PointerEvent) => {
        e.preventDefault();
        const pos = deps.getWidgets()[id];
        const gridEl = gridElGetter();
        if (!pos || !gridEl) return;

        const rect = gridEl.getBoundingClientRect();
        const colWidth = rect.width / GRID_COLS;

        dragId = id;
        ghostCol = pos.col;
        ghostRow = pos.row;
        ghostColSpan = pos.colSpan;
        ghostRowSpan = pos.rowSpan;
        gridWidth = rect.width;
        offsetX = e.clientX - rect.left - pos.col * colWidth;
        offsetY = e.clientY - rect.top - pos.row * ROW_HEIGHT;

        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
        document.addEventListener('keydown', handleKeyDown);
      };
    },
  };
}
