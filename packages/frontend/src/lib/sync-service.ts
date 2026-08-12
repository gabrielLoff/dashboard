import type { Habit } from './habit-store';
import type { WatchlistEntry } from './show-store';
import type { ApiResult } from '@dashboard/shared';
import { get } from 'svelte/store';
import { habitStore } from './habit-store';
import { showStore } from './show-store';
import { layoutStore } from './layout-store';
import { CAROUSEL_WIDGET_IDS } from './widget-registry';

const BASE = '/api';

export interface SyncData {
  habits: Habit[];
  watchlist: WatchlistEntry[];
  layout: { carouselOrder: string[] };
}

type QueuedPush = () => Promise<void>;

const retryQueue: QueuedPush[] = [];
let onlineHandler: (() => void) | null = null;

export async function pullAll(): Promise<ApiResult<SyncData>> {
  try {
    const res = await fetch(`${BASE}/sync`);
    const json = (await res.json()) as ApiResult<SyncData>;
    return json;
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

export async function pushHabits(habits: Habit[]): Promise<void> {
  const res = await fetch(`${BASE}/sync/habits`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ habits }),
  });
  if (!res.ok) throw new Error(`pushHabits failed: ${res.status}`);
}

export async function pushWatchlist(entries: WatchlistEntry[]): Promise<void> {
  const res = await fetch(`${BASE}/sync/watchlist`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries }),
  });
  if (!res.ok) throw new Error(`pushWatchlist failed: ${res.status}`);
}

export async function pushLayout(carouselOrder: string[]): Promise<void> {
  const res = await fetch(`${BASE}/sync/layout`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ carouselOrder }),
  });
  if (!res.ok) throw new Error(`pushLayout failed: ${res.status}`);
}

function queuePush(fn: QueuedPush): void {
  retryQueue.push(fn);
}

async function retryQueuedPushes(): Promise<void> {
  const pending = [...retryQueue];
  retryQueue.length = 0;

  for (const fn of pending) {
    try {
      await fn();
    } catch {
      retryQueue.push(fn);
    }
  }
}

function setupOnlineListener(): void {
  if (onlineHandler) return;
  onlineHandler = () => {
    retryQueuedPushes();
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('online', onlineHandler);
  }
}

export async function initSync(): Promise<SyncData | null> {
  setupOnlineListener();

  const result = await pullAll();
  if (result.ok) {
    const serverData = result.data;
    habitStore.setHabits(serverData.habits);

    showStore.reset();
    for (const entry of serverData.watchlist) {
      showStore.addShow(entry.id, entry.name, entry.image);
    }

    const serverOrder = serverData.layout.carouselOrder;
    const missing = CAROUSEL_WIDGET_IDS.filter((id) => !serverOrder.includes(id));
    const mergedOrder = [...serverOrder, ...missing];

    layoutStore.reset();
    layoutStore.reorder(mergedOrder);

    setupSyncSubscriptions();
    return serverData;
  }

  setupSyncSubscriptions();
  return null;
}

let syncSubscriptionsSetup = false;

function setupSyncSubscriptions(): void {
  if (syncSubscriptionsSetup) return;
  syncSubscriptionsSetup = true;

  let skipInitial = true;

  habitStore.subscribe((state) => {
    if (skipInitial) return;
    pushHabitsSafe(state.habits);
  });

  showStore.subscribe((state) => {
    if (skipInitial) return;
    pushWatchlistSafe(state.entries);
  });

  layoutStore.subscribe((state) => {
    if (skipInitial) return;
    pushLayoutSafe(state.carouselOrder);
  });

  skipInitial = false;
}

export function pushHabitsSafe(habits: Habit[]): void {
  pushHabits(habits).catch(() => {
    queuePush(() => pushHabits(get(habitStore).habits));
  });
}

export function pushWatchlistSafe(entries: WatchlistEntry[]): void {
  pushWatchlist(entries).catch(() => {
    queuePush(() => pushWatchlist(get(showStore).entries));
  });
}

export function pushLayoutSafe(carouselOrder: string[]): void {
  pushLayout(carouselOrder).catch(() => {
    const state = get(layoutStore);
    queuePush(() => pushLayout(state.carouselOrder));
  });
}
