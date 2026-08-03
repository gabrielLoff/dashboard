import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDragController } from '../src/lib/drag-controller.svelte';
import { layoutStore } from '../src/lib/layout-store';
import type { WidgetLayout } from '../src/lib/layout-store';

function makeGridEl(width = 600, height = 600): HTMLElement {
  const el = document.createElement('div');
  el.getBoundingClientRect = () => ({
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON() {},
  });
  return el;
}

function makePointerEvent(type: string, x: number, y: number): PointerEvent {
  return new PointerEvent(type, {
    clientX: x,
    clientY: y,
    bubbles: true,
    cancelable: true,
  });
}

const layoutWidgets: Record<string, WidgetLayout> = {
  weather: { col: 0, row: 0, colSpan: 3, rowSpan: 3 },
  news: { col: 3, row: 0, colSpan: 2, rowSpan: 2 },
};
const deps = { getWidgets: () => layoutWidgets };

describe('drag-controller', () => {
  let gridEl: HTMLElement;

  beforeEach(() => {
    gridEl = makeGridEl();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('startDrag sets dragId and ghost position from layout', () => {
    const controller = createDragController(deps, () => gridEl);
    const handler = controller.startDrag('weather');
    handler(makePointerEvent('pointerdown', 100, 50));

    expect(controller.state.dragId).toBe('weather');
    expect(controller.state.ghostCol).toBe(0);
    expect(controller.state.ghostRow).toBe(0);
    expect(controller.state.ghostColSpan).toBe(3);
    expect(controller.state.ghostRowSpan).toBe(3);
    expect(controller.state.gridWidth).toBe(600);
  });

  it('pointer move snaps ghost to grid', () => {
    const controller = createDragController(deps, () => gridEl);
    const handler = controller.startDrag('weather');
    handler(makePointerEvent('pointerdown', 100, 50));

    document.dispatchEvent(makePointerEvent('pointermove', 300, 200));

    expect(controller.state.ghostCol).toBe(2);
    expect(controller.state.ghostRow).toBe(2);
  });

  it('pointer up commits position via layoutStore.updatePosition', () => {
    const updateSpy = vi.spyOn(layoutStore, 'updatePosition');
    const controller = createDragController(deps, () => gridEl);
    const handler = controller.startDrag('weather');
    handler(makePointerEvent('pointerdown', 100, 50));

    document.dispatchEvent(makePointerEvent('pointermove', 300, 200));
    document.dispatchEvent(makePointerEvent('pointerup', 300, 200));

    expect(updateSpy).toHaveBeenCalledWith('weather', {
      col: controller.state.ghostCol,
      row: controller.state.ghostRow,
      colSpan: 3,
      rowSpan: 3,
    });
    expect(controller.state.dragId).toBeNull();
  });

  it('Escape key cancels drag (dragId becomes null)', () => {
    const controller = createDragController(deps, () => gridEl);
    const handler = controller.startDrag('weather');
    handler(makePointerEvent('pointerdown', 100, 50));

    expect(controller.state.dragId).toBe('weather');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(controller.state.dragId).toBeNull();
  });

  it('pointer up removes event listeners', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const controller = createDragController(deps, () => gridEl);
    const handler = controller.startDrag('weather');
    handler(makePointerEvent('pointerdown', 100, 50));

    document.dispatchEvent(makePointerEvent('pointerup', 300, 200));

    const types = removeSpy.mock.calls.map(([type]) => type);
    expect(types).toContain('pointermove');
    expect(types).toContain('pointerup');
    expect(types).toContain('keydown');
  });
});
