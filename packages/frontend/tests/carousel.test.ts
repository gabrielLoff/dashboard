import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Carousel from '../src/components/Carousel.svelte';
import { Newspaper, Gamepad2, Tv, CheckCircle } from 'lucide-svelte';

const mockItems = [
  { id: 'news', icon: Newspaper, label: 'News' },
  { id: 'games', icon: Gamepad2, label: 'Games' },
  { id: 'shows', icon: Tv, label: 'Shows' },
  { id: 'habits', icon: CheckCircle, label: 'Habits' },
];

describe('Carousel', () => {
  it('renders all icon tabs with labels', () => {
    render(Carousel, {
      props: {
        items: mockItems,
        children: () => '',
      },
    });

    expect(screen.getByText('News')).toBeInTheDocument();
    expect(screen.getByText('Games')).toBeInTheDocument();
    expect(screen.getByText('Shows')).toBeInTheDocument();
    expect(screen.getByText('Habits')).toBeInTheDocument();
  });

  it('highlights the first tab as active by default', () => {
    render(Carousel, {
      props: {
        items: mockItems,
        children: () => '',
      },
    });

    const newsButton = screen.getByLabelText('News');
    expect(newsButton).toHaveAttribute('aria-current', 'true');
    expect(newsButton.className).toContain('font-semibold');
  });

  it('switches to clicked tab', async () => {
    render(Carousel, {
      props: {
        items: mockItems,
        children: () => '',
      },
    });

    const gamesButton = screen.getByLabelText('Games');
    await fireEvent.click(gamesButton);

    expect(gamesButton).toHaveAttribute('aria-current', 'true');
    expect(gamesButton.className).toContain('font-semibold');

    const newsButton = screen.getByLabelText('News');
    expect(newsButton).not.toHaveAttribute('aria-current');
    expect(newsButton.className).not.toContain('font-semibold');
  });

  it('renders content for active item', () => {
    const { container } = render(Carousel, {
      props: {
        items: mockItems,
        children: () => 'test-content',
      },
    });

    const visibleSlide = container.querySelector('[aria-hidden="false"]');
    expect(visibleSlide).toBeInTheDocument();
  });

  it('hides content for inactive items', () => {
    const { container } = render(Carousel, {
      props: {
        items: mockItems,
        children: () => '',
      },
    });

    const hiddenSlides = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenSlides.length).toBe(mockItems.length - 1);
  });

  it('navigates forward on scroll down', async () => {
    render(Carousel, {
      props: {
        items: mockItems,
        children: () => '',
      },
    });

    const region = screen.getByRole('region', { name: 'Carousel content' });
    await fireEvent.wheel(region, { deltaY: 100 });

    const gamesButton = screen.getByLabelText('Games');
    expect(gamesButton).toHaveAttribute('aria-current', 'true');
  });

  it('navigates backward on scroll up', async () => {
    render(Carousel, {
      props: {
        items: mockItems,
        activeIndex: 1,
        children: () => '',
      },
    });

    const region = screen.getByRole('region', { name: 'Carousel content' });
    await fireEvent.wheel(region, { deltaY: -100 });

    const newsButton = screen.getByLabelText('News');
    expect(newsButton).toHaveAttribute('aria-current', 'true');
  });

  it('does not navigate past the last item', async () => {
    render(Carousel, {
      props: {
        items: mockItems,
        activeIndex: 3,
        children: () => '',
      },
    });

    const region = screen.getByRole('region', { name: 'Carousel content' });
    await fireEvent.wheel(region, { deltaY: 100 });

    const habitsButton = screen.getByLabelText('Habits');
    expect(habitsButton).toHaveAttribute('aria-current', 'true');
  });

  it('does not navigate before the first item', async () => {
    render(Carousel, {
      props: {
        items: mockItems,
        activeIndex: 0,
        children: () => '',
      },
    });

    const region = screen.getByRole('region', { name: 'Carousel content' });
    await fireEvent.wheel(region, { deltaY: -100 });

    const newsButton = screen.getByLabelText('News');
    expect(newsButton).toHaveAttribute('aria-current', 'true');
  });

  it('renders correct number of slides', () => {
    const { container } = render(Carousel, {
      props: {
        items: mockItems,
        children: () => '',
      },
    });

    const region = screen.getByRole('region', { name: 'Carousel content' });
    const slides = region.querySelectorAll('[aria-hidden]');
    expect(slides.length).toBe(mockItems.length);
  });

  it('applies custom class', () => {
    const { container } = render(Carousel, {
      props: {
        items: mockItems,
        children: () => '',
        class: 'my-custom-class',
      },
    });

    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveClass('my-custom-class');
  });

  it('starts at specified activeIndex', () => {
    render(Carousel, {
      props: {
        items: mockItems,
        activeIndex: 2,
        children: () => '',
      },
    });

    const showsButton = screen.getByLabelText('Shows');
    expect(showsButton).toHaveAttribute('aria-current', 'true');
  });
});
