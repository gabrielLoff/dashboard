import { writable, derived } from 'svelte/store';
import { WIDGET_IDS, DEFAULT_WIDGET_LAYOUTS } from './widget-registry';

const STORAGE_KEY = 'dashboard-layout';

export interface WidgetLayout {
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
}

/** @deprecated Use WidgetLayout with col/row/colSpan/rowSpan instead. Will be removed in ticket #3. */
export type WidgetSize = 'compact' | 'wide';

export { WIDGET_IDS };
export type WidgetId = (typeof WIDGET_IDS)[number];

export interface LayoutState {
  widgets: Record<string, WidgetLayout>;
  order: string[];
}

const DEFAULT_ORDER: string[] = [...WIDGET_IDS];

const DEFAULT_LAYOUT: LayoutState = {
  widgets: { ...DEFAULT_WIDGET_LAYOUTS },
  order: DEFAULT_ORDER,
};

function migrateOldLayout(parsed: { widgets: Record<string, { size?: string }>; order?: string[] }): LayoutState {
  const widgets: Record<string, WidgetLayout> = {};
  let currentRow = 0;
  let currentCol = 0;

  for (const id of DEFAULT_ORDER) {
    const old = parsed.widgets[id];
    if (old?.size === 'wide') {
      widgets[id] = { col: 0, row: currentRow, colSpan: 6, rowSpan: 2 };
      currentRow += 2;
      currentCol = 0;
    } else if (old?.size === 'compact') {
      if (currentCol > 4) {
        currentRow += 2;
        currentCol = 0;
      }
      widgets[id] = { col: currentCol, row: currentRow, colSpan: 2, rowSpan: 2 };
      currentCol += 2;
    } else {
      const fallback = DEFAULT_WIDGET_LAYOUTS[id];
      if (fallback) widgets[id] = { ...fallback };
    }
  }

  const order = Array.isArray(parsed.order) && parsed.order.length > 0
    ? parsed.order
    : DEFAULT_ORDER;
  const missing = DEFAULT_ORDER.filter((id) => !order.includes(id));

  return {
    widgets,
    order: [...order, ...missing],
  };
}

export function loadFromStorageForTest(): LayoutState {
  return loadFromStorage();
}

function loadFromStorage(): LayoutState {
  if (typeof localStorage === 'undefined') return DEFAULT_LAYOUT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.widgets) {
      const firstWidget = Object.values(parsed.widgets)[0] as Record<string, unknown> | undefined;
      if (firstWidget && typeof firstWidget === 'object' && 'size' in firstWidget) {
        return migrateOldLayout(parsed);
      }
      const order = Array.isArray(parsed.order) && parsed.order.length > 0
        ? parsed.order
        : DEFAULT_ORDER;
      const missing = DEFAULT_ORDER.filter((id) => !order.includes(id));
      return {
        widgets: parsed.widgets,
        order: [...order, ...missing],
      };
    }
    return DEFAULT_LAYOUT;
  } catch {
    return DEFAULT_LAYOUT;
  }
}

function saveToStorage(state: LayoutState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

function createStore() {
  const initial = loadFromStorage();
  const { subscribe, update, set } = writable<LayoutState>(initial);

  subscribe((state) => {
    saveToStorage(state);
  });

  return {
    subscribe,
    updatePosition(widgetId: string, position: WidgetLayout) {
      update((state) => ({
        ...state,
        widgets: {
          ...state.widgets,
          [widgetId]: { ...position },
        },
      }));
    },
    /** @deprecated Use updatePosition() instead. Will be removed in ticket #3. */
    toggleSize(widgetId: string) {
      update((state) => {
        const current = state.widgets[widgetId];
        const isWide = current && current.colSpan >= 4;
        const next: WidgetLayout = isWide
          ? { col: current.col, row: current.row, colSpan: 2, rowSpan: 2 }
          : { col: 0, row: 0, colSpan: 6, rowSpan: 2 };
        return {
          ...state,
          widgets: {
            ...state.widgets,
            [widgetId]: next,
          },
        };
      });
    },
    getPosition(widgetId: string): WidgetLayout {
      let position: WidgetLayout = DEFAULT_WIDGET_LAYOUTS[widgetId] ?? { col: 0, row: 0, colSpan: 2, rowSpan: 2 };
      const unsub = subscribe((state) => {
        position = state.widgets[widgetId] ?? DEFAULT_WIDGET_LAYOUTS[widgetId] ?? { col: 0, row: 0, colSpan: 2, rowSpan: 2 };
      });
      unsub();
      return position;
    },
    reorder(newOrder: string[]) {
      update((state) => ({
        ...state,
        order: newOrder,
      }));
    },
    getOrder(): string[] {
      let order: string[] = DEFAULT_ORDER;
      const unsub = subscribe((state) => {
        order = state.order;
      });
      unsub();
      return order;
    },
    reset() {
      set(DEFAULT_LAYOUT);
    },
  };
}

export const layoutStore = createStore();

export const layout = derived(layoutStore, ($store) => $store);
