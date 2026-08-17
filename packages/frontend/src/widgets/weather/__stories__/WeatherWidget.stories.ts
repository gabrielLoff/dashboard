import type { Meta, StoryObj } from '@storybook/svelte';
import WeatherWidget from '../WeatherWidget.svelte';

const meta: Meta<typeof WeatherWidget> = {
  title: 'Widgets/Weather',
  component: WeatherWidget,
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
