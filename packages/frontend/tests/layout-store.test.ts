import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { layoutStore, type LayoutState } from '../src/lib/layout-store';

beforeEach(() => {
  layoutStore.reset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('layoutStore', () => {
  it('starts with empty widgets', () => {
    let state: LayoutState = { widgets: {} };
    const unsub = layoutStore.subscribe((s) => (state = s));
    unsub();
    expect(state.widgets).toEqual({});
  });

  it('toggleSize sets widget to wide when compact', () => {
    layoutStore.toggleSize('weather');
    let state: LayoutState = { widgets: {} };
    const unsub = layoutStore.subscribe((s) => (state = s));
    unsub();
    expect(state.widgets.weather?.size).toBe('wide');
  });

  it('toggleSize sets widget to compact when wide', () => {
    layoutStore.toggleSize('weather');
    layoutStore.toggleSize('weather');
    let state: LayoutState = { widgets: {} };
    const unsub = layoutStore.subscribe((s) => (state = s));
    unsub();
    expect(state.widgets.weather?.size).toBe('compact');
  });

  it('getSize returns compact by default', () => {
    expect(layoutStore.getSize('weather')).toBe('compact');
  });

  it('getSize returns wide after toggle', () => {
    layoutStore.toggleSize('weather');
    expect(layoutStore.getSize('weather')).toBe('wide');
  });

  it('multiple widgets have independent sizes', () => {
    layoutStore.toggleSize('weather');
    layoutStore.toggleSize('news');
    layoutStore.toggleSize('news');

    expect(layoutStore.getSize('weather')).toBe('wide');
    expect(layoutStore.getSize('news')).toBe('compact');
    expect(layoutStore.getSize('agenda')).toBe('compact');
  });

  it('reset clears all sizes', () => {
    layoutStore.toggleSize('weather');
    layoutStore.toggleSize('news');
    layoutStore.reset();

    expect(layoutStore.getSize('weather')).toBe('compact');
    expect(layoutStore.getSize('news')).toBe('compact');
  });
});
