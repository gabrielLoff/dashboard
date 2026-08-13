import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { ok } from '@dashboard/shared';
import type { EpisodeListEntry, EpisodeProgress } from '@dashboard/shared';

const { mockFetchEpisodes } = vi.hoisted(() => ({
  mockFetchEpisodes: vi.fn(),
}));

vi.mock('$lib/api-client', () => ({
  fetchEpisodes: mockFetchEpisodes,
}));

const mockEpisodes: EpisodeListEntry[] = [
  { season: 1, number: 1, name: 'Pilot' },
  { season: 1, number: 2, name: 'Cats in the Bag' },
  { season: 1, number: 3, name: '...And the Bag\'s in the River' },
  { season: 2, number: 1, name: 'Grilled' },
  { season: 2, number: 2, name: 'Grilled' },
];

const mockProgress: EpisodeProgress = {
  showId: 169,
  showName: 'Breaking Bad',
  season: 1,
  episode: 2,
  watchedAt: '2026-07-28T12:00:00.000Z',
};

import EpisodePickerModal from '../src/widgets/watching/EpisodePickerModal.svelte';

describe('EpisodePickerModal', () => {
  const defaultProps = {
    showId: 169,
    showName: 'Breaking Bad',
    currentProgress: mockProgress,
    onAdvance: vi.fn(),
    onReset: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchEpisodes.mockResolvedValue(ok(mockEpisodes));
  });

  it('renders show name', async () => {
    render(EpisodePickerModal, { props: defaultProps });
    expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
  });

  it('renders season tabs', async () => {
    render(EpisodePickerModal, { props: defaultProps });
    expect(await screen.findByText('S1')).toBeInTheDocument();
    expect(screen.getByText('S2')).toBeInTheDocument();
  });

  it('renders episode list', async () => {
    render(EpisodePickerModal, { props: defaultProps });
    expect(await screen.findByText('Pilot')).toBeInTheDocument();
    expect(screen.getByText('Cats in the Bag')).toBeInTheDocument();
  });

  it('shows watched checkmarks for episodes up to current progress', async () => {
    render(EpisodePickerModal, { props: defaultProps });
    await screen.findByText('Pilot');

    const buttons = screen.getAllByRole('button');
    const pilotButton = buttons.find((b) => b.textContent?.includes('Pilot'));
    expect(pilotButton).toBeDefined();
  });

  it('calls onClose when escape is pressed', async () => {
    render(EpisodePickerModal, { props: defaultProps });
    await screen.findByText('Breaking Bad');

    const backdrop = document.querySelector('.fixed.inset-0');
    expect(backdrop).toBeDefined();
    await fireEvent.keyDown(backdrop!, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', async () => {
    render(EpisodePickerModal, { props: defaultProps });
    await screen.findByText('Breaking Bad');

    const backdrop = document.querySelector('.fixed.inset-0');
    expect(backdrop).toBeDefined();
    await fireEvent.click(backdrop!);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onReset when reset button is clicked', async () => {
    render(EpisodePickerModal, { props: defaultProps });
    await screen.findByText('Breaking Bad');

    const resetButton = screen.getByText('Reset progress');
    await fireEvent.click(resetButton);
    expect(defaultProps.onReset).toHaveBeenCalled();
  });
});
