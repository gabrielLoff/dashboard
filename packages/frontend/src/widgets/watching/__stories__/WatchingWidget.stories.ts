import type { Meta, StoryObj } from '@storybook/svelte';
import WatchingWidget from '../WatchingWidget.svelte';

const meta: Meta<typeof WatchingWidget> = {
  title: 'Widgets/Watching',
  component: WatchingWidget,
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
