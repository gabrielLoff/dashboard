import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { layoutStore, WIDGET_IDS, loadFromStorageForTest, type LayoutState } from '../src/lib/layout-store';

beforeEach(() => {
  layoutStore.reset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('layoutStore', () => {
  describe('position', () => {
    it('starts with default positions for all widgets', () => {
      let state: LayoutState = { widgets: {}, order: [] };
      const unsub = layoutStore.subscribe((s) => (state = s));
      unsub();
      expect(state.widgets.weather).toEqual({ col: 0, row: 0, colSpan: 3, rowSpan: 3 });
      expect(state.widgets.habits).toEqual({ col: 3, row: 0, colSpan: 3, rowSpan: 2 });
      expect(state.widgets.news).toEqual({ col: 0, row: 3, colSpan: 2, rowSpan: 4 });
      expect(state.widgets.games).toEqual({ col: 2, row: 3, colSpan: 3, rowSpan: 4 });
      expect(state.widgets.agenda).toEqual({ col: 5, row: 2, colSpan: 1, rowSpan: 5 });
      expect(state.widgets.shows).toEqual({ col: 3, row: 5, colSpan: 3, rowSpan: 3 });
    });

    it('updatePosition sets widget position', () => {
      layoutStore.updatePosition('weather', { col: 1, row: 1, colSpan: 2, rowSpan: 2 });
      const pos = layoutStore.getPosition('weather');
      expect(pos).toEqual({ col: 1, row: 1, colSpan: 2, rowSpan: 2 });
    });

    it('getPosition returns default position for unset widget', () => {
      const pos = layoutStore.getPosition('weather');
      expect(pos).toEqual({ col: 0, row: 0, colSpan: 3, rowSpan: 3 });
    });

    it('multiple widgets have independent positions', () => {
      layoutStore.updatePosition('weather', { col: 0, row: 0, colSpan: 4, rowSpan: 3 });
      layoutStore.updatePosition('news', { col: 0, row: 3, colSpan: 2, rowSpan: 2 });

      expect(layoutStore.getPosition('weather')).toEqual({ col: 0, row: 0, colSpan: 4, rowSpan: 3 });
      expect(layoutStore.getPosition('news')).toEqual({ col: 0, row: 3, colSpan: 2, rowSpan: 2 });
      expect(layoutStore.getPosition('agenda')).toEqual({ col: 5, row: 2, colSpan: 1, rowSpan: 5 });
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
      layoutStore.reorder(['habits', 'weather', 'news', 'agenda', 'games', 'shows']);
      let state: LayoutState = { widgets: {}, order: [] };
      const unsub = layoutStore.subscribe((s) => (state = s));
      unsub();
      expect(state.order).toEqual(['habits', 'weather', 'news', 'agenda', 'games', 'shows']);
    });

    it('getOrder returns current order', () => {
      layoutStore.reorder(['habits', 'weather', 'news', 'agenda', 'games', 'shows']);
      expect(layoutStore.getOrder()).toEqual(['habits', 'weather', 'news', 'agenda', 'games', 'shows']);
    });

    it('getOrder returns default order initially', () => {
      expect(layoutStore.getOrder()).toEqual([...WIDGET_IDS]);
    });

    it('reorder persists alongside position', () => {
      layoutStore.updatePosition('weather', { col: 0, row: 0, colSpan: 4, rowSpan: 3 });
      layoutStore.reorder(['habits', 'weather', 'news', 'agenda', 'games', 'shows']);

      let state: LayoutState = { widgets: {}, order: [] };
      const unsub = layoutStore.subscribe((s) => (state = s));
      unsub();

      expect(state.order).toEqual(['habits', 'weather', 'news', 'agenda', 'games', 'shows']);
      expect(state.widgets.weather).toEqual({ col: 0, row: 0, colSpan: 4, rowSpan: 3 });
    });
  });

  describe('reset', () => {
    it('reset clears all positions and order to defaults', () => {
      layoutStore.updatePosition('weather', { col: 1, row: 1, colSpan: 2, rowSpan: 2 });
      layoutStore.updatePosition('news', { col: 0, row: 0, colSpan: 6, rowSpan: 1 });
      layoutStore.reorder(['habits', 'weather', 'news', 'agenda', 'games', 'shows']);
      layoutStore.reset();

      expect(layoutStore.getPosition('weather')).toEqual({ col: 0, row: 0, colSpan: 3, rowSpan: 3 });
      expect(layoutStore.getPosition('news')).toEqual({ col: 0, row: 3, colSpan: 2, rowSpan: 4 });
      expect(layoutStore.getOrder()).toEqual([...WIDGET_IDS]);
    });
  });

  describe('migration', () => {
    it('migrates old compact widget to 2x2 grid position', () => {
      const oldState = {
        widgets: { weather: { size: 'compact' }, news: { size: 'compact' } },
        order: ['weather', 'news', 'agenda', 'games', 'shows', 'habits'],
      };
      localStorage.setItem('dashboard-layout', JSON.stringify(oldState));

      const migrated = loadFromStorageForTest();

      expect(migrated.widgets.weather?.colSpan).toBe(2);
      expect(migrated.widgets.weather?.rowSpan).toBe(2);
      expect(migrated.widgets.news?.colSpan).toBe(2);
      expect(migrated.widgets.news?.rowSpan).toBe(2);
    });

    it('migrates old wide widget to full-width grid position', () => {
      const oldState = {
        widgets: { weather: { size: 'wide' } },
        order: ['weather', 'news', 'agenda', 'games', 'shows', 'habits'],
      };
      localStorage.setItem('dashboard-layout', JSON.stringify(oldState));

      const migrated = loadFromStorageForTest();

      expect(migrated.widgets.weather?.colSpan).toBe(6);
      expect(migrated.widgets.weather?.rowSpan).toBe(2);
    });
  });
});
