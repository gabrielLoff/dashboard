import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import WidgetCard from '../src/components/WidgetCard.svelte';

const defaultChildren = () => '';

describe('WidgetCard', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders title', () => {
    render(WidgetCard, {
      props: {
        title: 'Weather',
        isLoading: false,
        isFetching: false,
        error: '',
        onRefresh: vi.fn(),
        children: defaultChildren,
      },
    });
    expect(screen.getByText('Weather')).toBeInTheDocument();
  });

  it('shows loading spinner when isLoading', () => {
    const { container } = render(WidgetCard, {
      props: {
        title: 'Weather',
        isLoading: true,
        isFetching: false,
        error: '',
        onRefresh: vi.fn(),
        children: defaultChildren,
      },
    });
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message when error is set', () => {
    render(WidgetCard, {
      props: {
        title: 'Weather',
        isLoading: false,
        isFetching: false,
        error: 'Something went wrong',
        onRefresh: vi.fn(),
        children: defaultChildren,
      },
    });
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('displays relative timestamp from updatedAt', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T12:05:00'));

    const fiveMinAgo = new Date('2026-07-28T12:00:00').toISOString();
    render(WidgetCard, {
      props: {
        title: 'Weather',
        isLoading: false,
        isFetching: false,
        error: '',
        onRefresh: vi.fn(),
        updatedAt: fiveMinAgo,
        children: defaultChildren,
      },
    });

    expect(screen.getByText(/Updated/)).toBeInTheDocument();
    expect(screen.getByText(/5m ago/)).toBeInTheDocument();
  });

  it('shows "just now" for very recent timestamps', () => {
    vi.useFakeTimers();
    const now = new Date('2026-07-28T12:00:30');
    vi.setSystemTime(now);

    render(WidgetCard, {
      props: {
        title: 'Weather',
        isLoading: false,
        isFetching: false,
        error: '',
        onRefresh: vi.fn(),
        updatedAt: now.toISOString(),
        children: defaultChildren,
      },
    });

    expect(screen.getByText(/just now/)).toBeInTheDocument();
  });

  it('does not show timestamp when updatedAt is not provided', () => {
    render(WidgetCard, {
      props: {
        title: 'Weather',
        isLoading: false,
        isFetching: false,
        error: '',
        onRefresh: vi.fn(),
        children: defaultChildren,
      },
    });

    expect(screen.queryByText(/Updated/)).not.toBeInTheDocument();
  });
});
