import type { Meta, StoryObj } from '@storybook/svelte';
import HabitWidget from '../HabitWidget.svelte';

const meta: Meta<typeof HabitWidget> = {
  title: 'Widgets/Habits',
  component: HabitWidget,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
    themes: { dark: true },
  },
};
