import type { WidgetManifest } from '@dashboard/shared';
import HabitWidget from './HabitWidget.svelte';

export const manifest: WidgetManifest = {
  id: 'habits',
  component: HabitWidget,
  zone: 'carousel',
  defaultLayout: { col: 3, row: 0, colSpan: 3, rowSpan: 2 },
};
