import type { Meta, StoryObj } from '@storybook/svelte';
import NewsWidget from '../NewsWidget.svelte';

const meta: Meta<typeof NewsWidget> = {
  title: 'Widgets/News',
  component: NewsWidget,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
    themes: {
      dark: true,
    },
  },
};
