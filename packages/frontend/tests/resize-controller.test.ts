import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createResizeController } from '../src/lib/resize-controller.svelte';
import type { WidgetLayout } from '../src/lib/layout-store';

function pointerEvent(clientX: number, clientY: number): PointerEvent {
  return { clientX, clientY, preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as PointerEvent;
}

describe('resize-controller', () => {
  let widgets: Record<string, WidgetLayout>;
  let updatePositionMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    widgets = {
      weather: { col: 0, row: 0, colSpan: 3, rowSpan: 3 },
      news: { col: 0, row: 8, colSpan: 2, rowSpan: 4 },
    };
    updatePositionMock = vi.fn();
  });

  function makeController(gridWidth = 600) {
    return createResizeController({
      getWidgets: () => widgets,
      gridWidthGetter: () => gridWidth,
      updatePosition: updatePositionMock,
    });
  }

  it('startResize sets resizeId, edge, and original dimensions', () => {
    const ctrl = makeController();
    const handler = ctrl.startResize('weather');
    handler(pointerEvent(100, 100), 'right');

    expect(ctrl.state.resizeId).toBe('weather');
    expect(ctrl.state.resizeEdge).toBe('right');
    expect(ctrl.state.resizeOrigColSpan).toBe(3);
    expect(ctrl.state.resizeOrigRowSpan).toBe(3);
    expect(ctrl.state.resizePreviewColSpan).toBe(3);
    expect(ctrl.state.resizePreviewRowSpan).toBe(3);
  });

  it('pointer move on right edge changes colSpan preview', () => {
    const ctrl = makeController(600);
    const handler = ctrl.startResize('weather');
    handler(pointerEvent(100, 100), 'right');

    // colWidth = 600/6 = 100px, move 150px right → +1.5 → round to +2 → colSpan 3+2=5
    ctrl.handleResizeMove(pointerEvent(250, 100));

    expect(ctrl.state.resizePreviewColSpan).toBe(5);
    expect(ctrl.state.resizePreviewRowSpan).toBe(3);
  });

  it('pointer move on bottom edge changes rowSpan preview', () => {
    const ctrl = makeController(600);
    const handler = ctrl.startResize('weather');
    handler(pointerEvent(100, 100), 'bottom');

    // ROW_HEIGHT=120, move 180px down → +1.5 → round to +2 → rowSpan 3+2=5
    ctrl.handleResizeMove(pointerEvent(100, 280));

    expect(ctrl.state.resizePreviewColSpan).toBe(3);
    expect(ctrl.state.resizePreviewRowSpan).toBe(5);
  });

  it('pointer move on corner changes both previews', () => {
    const ctrl = makeController(600);
    const handler = ctrl.startResize('weather');
    handler(pointerEvent(100, 100), 'corner');

    ctrl.handleResizeMove(pointerEvent(250, 280));

    expect(ctrl.state.resizePreviewColSpan).toBe(5);
    expect(ctrl.state.resizePreviewRowSpan).toBe(5);
  });

  it('collision blocks resize (preview stays at original)', () => {
    widgets = {
      weather: { col: 0, row: 0, colSpan: 3, rowSpan: 3 },
      news: { col: 3, row: 0, colSpan: 3, rowSpan: 2 },
    };
    const ctrl = makeController(600);
    const handler = ctrl.startResize('weather');
    handler(pointerEvent(100, 100), 'right');

    // Moving right would make weather col=0,colSpan=5 which collides with news at col=3
    ctrl.handleResizeMove(pointerEvent(350, 100));

    expect(ctrl.state.resizePreviewColSpan).toBe(3);
    expect(ctrl.state.resizePreviewRowSpan).toBe(3);
  });

  it('pointer up commits resize via updatePosition', () => {
    const ctrl = makeController(600);
    const handler = ctrl.startResize('weather');
    handler(pointerEvent(100, 100), 'right');

    ctrl.handleResizeMove(pointerEvent(250, 100));
    ctrl.handleResizeEnd();

    expect(updatePositionMock).toHaveBeenCalledWith('weather', {
      col: 0,
      row: 0,
      colSpan: 5,
      rowSpan: 3,
    });
    expect(ctrl.state.resizeId).toBeNull();
  });

  it('Escape cancels resize (resizeId becomes null)', () => {
    const ctrl = makeController(600);
    const handler = ctrl.startResize('weather');
    handler(pointerEvent(100, 100), 'right');

    ctrl.handleResizeKeyDown({ key: 'Escape' } as KeyboardEvent);

    expect(ctrl.state.resizeId).toBeNull();
    expect(updatePositionMock).not.toHaveBeenCalled();
  });

  it('enforces minimum colSpan of 2', () => {
    const ctrl = makeController(600);
    const handler = ctrl.startResize('weather');
    handler(pointerEvent(100, 100), 'right');

    // Move far left: 3 + round(-300/100) = 3 + (-3) = 0 → clamped to 2
    ctrl.handleResizeMove(pointerEvent(-200, 100));

    expect(ctrl.state.resizePreviewColSpan).toBe(2);
  });

  it('enforces minimum rowSpan of 2', () => {
    const ctrl = makeController(600);
    const handler = ctrl.startResize('weather');
    handler(pointerEvent(100, 100), 'bottom');

    // Move far up: 3 + round(-240/120) = 3 + (-2) = 1 → clamped to 2
    ctrl.handleResizeMove(pointerEvent(100, -140));

    expect(ctrl.state.resizePreviewRowSpan).toBe(2);
  });
});
