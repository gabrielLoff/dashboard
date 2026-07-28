import { writable, derived } from 'svelte/store';

const STORAGE_KEY = 'dashboard-layout';

export type WidgetSize = 'compact' | 'wide';

export interface WidgetLayout {
  size: WidgetSize;
}

export const WIDGET_IDS = ['weather', 'news', 'agenda', 'games', 'shows', 'habits'] as const;
export type WidgetId = (typeof WIDGET_IDS)[number];

export interface LayoutState {
  widgets: Record<string, WidgetLayout>;
  order: string[];
}

const DEFAULT_ORDER: string[] = [...WIDGET_IDS];

const DEFAULT_LAYOUT: LayoutState = {
  widgets: {},
  order: DEFAULT_ORDER,
};

function loadFromStorage(): LayoutState {
  if (typeof localStorage === 'undefined') return DEFAULT_LAYOUT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.widgets) {
      return {
        widgets: parsed.widgets,
        order: Array.isArray(parsed.order) && parsed.order.length > 0
          ? parsed.order
          : DEFAULT_ORDER,
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
    toggleSize(widgetId: string) {
      update((state) => {
        const current = state.widgets[widgetId]?.size ?? 'compact';
        const next: WidgetSize = current === 'compact' ? 'wide' : 'compact';
        return {
          ...state,
          widgets: {
            ...state.widgets,
            [widgetId]: { size: next },
          },
        };
      });
    },
    getSize(widgetId: string): WidgetSize {
      let size: WidgetSize = 'compact';
      const unsub = subscribe((state) => {
        size = state.widgets[widgetId]?.size ?? 'compact';
      });
      unsub();
      return size;
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
