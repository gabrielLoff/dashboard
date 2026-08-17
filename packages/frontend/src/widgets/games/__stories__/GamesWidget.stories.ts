import type { Meta, StoryObj } from '@storybook/svelte';
import GamesWidget from '../GamesWidget.svelte';

const meta: Meta<typeof GamesWidget> = {
  title: 'Widgets/Games',
  component: GamesWidget,
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
