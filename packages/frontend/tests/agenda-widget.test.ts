import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import AgendaWidget from '../src/widgets/agenda/AgendaWidget.svelte';
import { ok } from '@dashboard/shared';
import type { AgendaData } from '@dashboard/shared';

const BASE_DATE = new Date('2026-07-28T12:00:00');

function makeDate(daysFromNow: number): string {
  const d = new Date(BASE_DATE);
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

const mockAgendaData: AgendaData = {
  events: [
    {
      id: '1',
      title: 'Team Standup',
      date: makeDate(0),
      time: '09:00',
      location: 'Google Meet',
      description: 'Daily sync',
      status: 'confirmed',
    },
    {
      id: '2',
      title: 'Design Review',
      date: makeDate(1),
      time: '14:00',
      location: 'Conference Room',
      description: 'Review mockups',
      status: 'confirmed',
    },
    {
      id: '3',
      title: 'Sprint Planning',
      date: makeDate(3),
      time: '10:00',
      location: 'Zoom',
      description: 'Plan next sprint',
      status: 'tentative',
    },
  ],
  updatedAt: '2026-07-28T12:00:00Z',
};

vi.mock('$lib/query-config', () => ({
  useSourceQuery: () => ({
    subscribe: (fn: (val: unknown) => void) => {
      fn({ data: ok(mockAgendaData), isLoading: false, isFetching: false });
      return () => {};
    },
  }),
}));

vi.mock('$lib/api-client', () => ({
  refreshAgenda: vi.fn(),
}));

vi.mock('svelte-french-toast', () => ({
  default: { success: vi.fn() },
}));

vi.mock('$lib/query-client', () => ({
  queryClient: { setQueryData: vi.fn(), invalidateQueries: vi.fn() },
}));

describe('AgendaWidget', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows "Today" for events happening today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T12:00:00'));

    render(AgendaWidget);
    expect(screen.getByText(/Today/)).toBeInTheDocument();
  });

  it('shows "Tomorrow" for events happening tomorrow', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T12:00:00'));

    render(AgendaWidget);
    expect(screen.getByText(/Tomorrow/)).toBeInTheDocument();
  });

  it('renders event titles', () => {
    render(AgendaWidget);
    expect(screen.getByText('Team Standup')).toBeInTheDocument();
    expect(screen.getByText('Design Review')).toBeInTheDocument();
  });

  it('renders event times', () => {
    render(AgendaWidget);
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('14:00')).toBeInTheDocument();
  });

  it('renders event locations', () => {
    render(AgendaWidget);
    expect(screen.getByText('Google Meet')).toBeInTheDocument();
    expect(screen.getByText('Conference Room')).toBeInTheDocument();
  });
});
