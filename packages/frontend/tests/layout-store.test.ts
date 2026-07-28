import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { layoutStore, WIDGET_IDS, type LayoutState } from '../src/lib/layout-store';

beforeEach(() => {
  layoutStore.reset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('layoutStore', () => {
  describe('size', () => {
    it('starts with empty widgets', () => {
      let state: LayoutState = { widgets: {}, order: [] };
      const unsub = layoutStore.subscribe((s) => (state = s));
      unsub();
      expect(state.widgets).toEqual({});
    });

    it('toggleSize sets widget to wide when compact', () => {
      layoutStore.toggleSize('weather');
      let state: LayoutState = { widgets: {}, order: [] };
      const unsub = layoutStore.subscribe((s) => (state = s));
      unsub();
      expect(state.widgets.weather?.size).toBe('wide');
    });

    it('toggleSize sets widget to compact when wide', () => {
      layoutStore.toggleSize('weather');
      layoutStore.toggleSize('weather');
      let state: LayoutState = { widgets: {}, order: [] };
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
  });

  describe('order', () => {
    it('starts with default order', () => {
      let state: LayoutState = { widgets: {}, order: [] };
      const unsub = layoutStore.subscribe((s) => (state = s));
      unsub();
      expect(state.order).toEqual([...WIDGET_IDS]);
    });

    it('reorder changes the order', () => {
      layoutStore.reorder(['habits', 'weather', 'news', 'agenda', 'games']);
      let state: LayoutState = { widgets: {}, order: [] };
      const unsub = layoutStore.subscribe((s) => (state = s));
      unsub();
      expect(state.order).toEqual(['habits', 'weather', 'news', 'agenda', 'games']);
    });

    it('getOrder returns current order', () => {
      layoutStore.reorder(['habits', 'weather', 'news', 'agenda', 'games']);
      expect(layoutStore.getOrder()).toEqual(['habits', 'weather', 'news', 'agenda', 'games']);
    });

    it('getOrder returns default order initially', () => {
      expect(layoutStore.getOrder()).toEqual([...WIDGET_IDS]);
    });

    it('reorder persists alongside size', () => {
      layoutStore.toggleSize('weather');
      layoutStore.reorder(['habits', 'weather', 'news', 'agenda', 'games']);

      let state: LayoutState = { widgets: {}, order: [] };
      const unsub = layoutStore.subscribe((s) => (state = s));
      unsub();

      expect(state.order).toEqual(['habits', 'weather', 'news', 'agenda', 'games']);
      expect(state.widgets.weather?.size).toBe('wide');
    });
  });

  describe('reset', () => {
    it('reset clears all sizes and order', () => {
      layoutStore.toggleSize('weather');
      layoutStore.toggleSize('news');
      layoutStore.reorder(['habits', 'weather', 'news', 'agenda', 'games']);
      layoutStore.reset();

      expect(layoutStore.getSize('weather')).toBe('compact');
      expect(layoutStore.getSize('news')).toBe('compact');
      expect(layoutStore.getOrder()).toEqual([...WIDGET_IDS]);
    });
  });
});
