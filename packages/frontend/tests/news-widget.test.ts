import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import NewsWidget from '../src/widgets/news/NewsWidget.svelte';
import { ok } from '@dashboard/shared';
import type { NewsData } from '@dashboard/shared';

const mockNewsData: NewsData = {
  items: [
    {
      id: '1',
      title: 'Article with image',
      source: 'Test Source',
      url: 'https://example.com/1',
      publishedAt: '2026-07-28T12:00:00Z',
      summary: 'This is a summary of the article.',
      imageUrl: 'https://example.com/image.jpg',
    },
    {
      id: '2',
      title: 'Article without image',
      source: 'Another Source',
      url: 'https://example.com/2',
      publishedAt: '2026-07-28T11:00:00Z',
      summary: '',
    },
  ],
  updatedAt: '2026-07-28T12:00:00Z',
};

vi.mock('$lib/query-config', () => ({
  useSourceQuery: () => ({
    subscribe: (fn: (val: unknown) => void) => {
      fn({ data: ok(mockNewsData), isLoading: false, isFetching: false });
      return () => {};
    },
  }),
}));

vi.mock('$lib/api-client', () => ({
  refreshNews: vi.fn(),
}));

vi.mock('svelte-french-toast', () => ({
  default: { success: vi.fn() },
}));

vi.mock('$lib/query-client', () => ({
  queryClient: { setQueryData: vi.fn(), invalidateQueries: vi.fn() },
}));

describe('NewsWidget', () => {
  it('renders article title', () => {
    render(NewsWidget);
    expect(screen.getByText('Article with image')).toBeInTheDocument();
  });

  it('renders image when imageUrl is present', () => {
    render(NewsWidget);
    const img = document.querySelector('img[src="https://example.com/image.jpg"]');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('does not render image when imageUrl is absent', () => {
    render(NewsWidget);
    const images = document.querySelectorAll('img');
    expect(images).toHaveLength(1);
  });

  it('renders summary when present', () => {
    render(NewsWidget);
    expect(screen.getByText('This is a summary of the article.')).toBeInTheDocument();
  });

  it('renders source name', () => {
    render(NewsWidget);
    expect(screen.getByText('Test Source')).toBeInTheDocument();
  });
});
