import type { WidgetLayout } from './layout-store';
import { manifest as weather } from '$widgets/weather/manifest';
import { manifest as news } from '$widgets/news/manifest';
import { manifest as agenda } from '$widgets/agenda/manifest';
import { manifest as games } from '$widgets/games/manifest';
import { manifest as shows } from '$widgets/shows/manifest';
import { manifest as habits } from '$widgets/habits/manifest';

const manifests = [weather, news, agenda, games, shows, habits];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const COMPONENTS: Record<string, any> = {};
export const WIDGET_IDS: string[] = [];
export const DEFAULT_WIDGET_LAYOUTS: Record<string, WidgetLayout> = {};

for (const m of manifests) {
  COMPONENTS[m.id] = m.component;
  WIDGET_IDS.push(m.id);
  DEFAULT_WIDGET_LAYOUTS[m.id] = m.defaultLayout;
}

interface SourceConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  key: (...args: any[]) => readonly unknown[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (...args: any[]) => Promise<any>;
  staleTime: number;
  refetchInterval: number;
}

export const sourceConfigs: Record<string, SourceConfig> = {};

for (const m of manifests) {
  if (m.queryKey && m.queryFn && m.staleTime != null && m.refetchInterval != null) {
    sourceConfigs[m.id] = {
      key: m.queryKey,
      fn: m.queryFn,
      staleTime: m.staleTime,
      refetchInterval: m.refetchInterval,
    };
  }
}
