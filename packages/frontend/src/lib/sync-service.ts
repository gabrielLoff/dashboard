import { request, type ApiResult, type SyncData } from '@dashboard/shared';
import type { StoreSyncAdapter } from './store-sync-adapters';

export type { SyncData };

type QueuedPush = () => Promise<void>;

export class SyncOrchestrator {
  private retryQueue: QueuedPush[] = [];
  private onlineHandler: (() => void) | null = null;
  private subscriptionsSetup = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private adapters: StoreSyncAdapter<any>[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(adapters: StoreSyncAdapter<any>[]) {
    this.adapters = adapters;
  }

  private queuePush(fn: QueuedPush): void {
    this.retryQueue.push(fn);
  }

  private async retryQueuedPushes(): Promise<void> {
    const pending = [...this.retryQueue];
    this.retryQueue.length = 0;

    for (const fn of pending) {
      try {
        await fn();
      } catch {
        this.retryQueue.push(fn);
      }
    }
  }

  private setupOnlineListener(): void {
    if (this.onlineHandler) return;
    this.onlineHandler = () => {
      void this.retryQueuedPushes();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.onlineHandler);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private setupSubscriptions(adapters: StoreSyncAdapter<any>[]): void {
    if (this.subscriptionsSetup) return;
    this.subscriptionsSetup = true;

    let skipInitial = true;

    for (const adapter of adapters) {
      adapter.subscribe((data) => {
        if (skipInitial) return;
        this.safePush(adapter, data);
      });
    }

    skipInitial = false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private safePush(adapter: StoreSyncAdapter<any>, data: any): void {
    adapter.push(data).catch(() => {
      this.queuePush(() => adapter.push(data));
    });
  }

  async init(): Promise<SyncData | null> {
    this.setupOnlineListener();

    const result = await pullAll();
    if (result.ok) {
      const serverData = result.data;
      for (const adapter of this.adapters) {
        adapter.hydrate(serverData);
      }
      this.setupSubscriptions(this.adapters);
      return serverData;
    }

    this.setupSubscriptions(this.adapters);
    return null;
  }
}

export async function pullAll(): Promise<ApiResult<SyncData>> {
  return request('GET /api/sync');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initSync(adapters: StoreSyncAdapter<any>[]): Promise<SyncData | null> {
  const orchestrator = new SyncOrchestrator(adapters);
  return orchestrator.init();
}
