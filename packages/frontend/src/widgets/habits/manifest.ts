import type { LocalWidget } from '@dashboard/shared';
import HabitWidget from './HabitWidget.svelte';

export const manifest = {
  id: 'habits',
  component: HabitWidget,
  zone: 'carousel',
} satisfies LocalWidget;
