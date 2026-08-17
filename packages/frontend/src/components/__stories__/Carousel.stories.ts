import type { Meta, StoryObj } from '@storybook/svelte';
import Carousel from '../Carousel.svelte';

const meta: Meta<typeof Carousel> = {
  title: 'Components/Carousel',
  component: Carousel,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
