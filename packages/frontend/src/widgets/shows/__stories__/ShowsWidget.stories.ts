import type { Meta, StoryObj } from '@storybook/svelte';
import ShowsWidget from '../ShowsWidget.svelte';

const meta: Meta<typeof ShowsWidget> = {
  title: 'Widgets/Shows',
  component: ShowsWidget,
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
