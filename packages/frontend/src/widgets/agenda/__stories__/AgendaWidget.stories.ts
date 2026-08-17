import type { Meta, StoryObj } from '@storybook/svelte';
import AgendaWidget from '../AgendaWidget.svelte';

const meta: Meta<typeof AgendaWidget> = {
  title: 'Widgets/Agenda',
  component: AgendaWidget,
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
