import { manifest as weather } from '$widgets/weather/manifest';
import { manifest as news } from '$widgets/news/manifest';
import { manifest as agenda } from '$widgets/agenda/manifest';
import { manifest as games } from '$widgets/games/manifest';
import { manifest as shows } from '$widgets/shows/manifest';
import { manifest as habits } from '$widgets/habits/manifest';
import { manifest as watching } from '$widgets/watching/manifest';
import { Newspaper, Gamepad2, Tv, CheckCircle, Eye } from 'lucide-svelte';
import type { CarouselItem } from '$components/Carousel.svelte';

const manifests = [weather, news, agenda, games, shows, habits, watching];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const COMPONENTS: Record<string, any> = {};
export const WIDGET_IDS: string[] = [];

export const LEFT_WIDGET_IDS: string[] = [];
export const CAROUSEL_WIDGET_IDS: string[] = [];

for (const m of manifests) {
  COMPONENTS[m.id] = m.component;
  WIDGET_IDS.push(m.id);

  if (m.zone === 'left') {
    LEFT_WIDGET_IDS.push(m.id);
  } else {
    CAROUSEL_WIDGET_IDS.push(m.id);
  }
}

export const CAROUSEL_ITEMS: CarouselItem[] = [
  { id: 'news', icon: Newspaper, label: 'News' },
  { id: 'games', icon: Gamepad2, label: 'Games' },
  { id: 'shows', icon: Tv, label: 'Shows' },
  { id: 'habits', icon: CheckCircle, label: 'Habits' },
  { id: 'watching', icon: Eye, label: 'Watching' },
];

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
