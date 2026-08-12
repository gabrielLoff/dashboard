import { writable, derived } from 'svelte/store';
import { CAROUSEL_WIDGET_IDS } from './widget-registry';

const STORAGE_KEY = 'dashboard-carousel-order';

export interface LayoutState {
  carouselOrder: string[];
}

const DEFAULT_LAYOUT: LayoutState = {
  carouselOrder: [...CAROUSEL_WIDGET_IDS],
};

function loadFromStorage(): LayoutState {
  if (typeof localStorage === 'undefined') return DEFAULT_LAYOUT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.carouselOrder)) {
      const missing = CAROUSEL_WIDGET_IDS.filter((id) => !parsed.carouselOrder.includes(id));
      return {
        carouselOrder: [...parsed.carouselOrder, ...missing],
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
    reorder(newOrder: string[]) {
      update((state) => ({
        ...state,
        carouselOrder: newOrder,
      }));
    },
    getCarouselOrder(): string[] {
      let order: string[] = CAROUSEL_WIDGET_IDS;
      const unsub = subscribe((state) => {
        order = state.carouselOrder;
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
