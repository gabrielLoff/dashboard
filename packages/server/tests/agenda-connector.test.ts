import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockGetAccessToken } = vi.hoisted(() => ({
  mockGetAccessToken: vi.fn(),
}));
vi.mock('../src/lib/google-auth.ts', () => ({
  getAccessToken: mockGetAccessToken,
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { fetchAgenda } from '../src/connectors/agenda.ts';

const mockCalendarResponse = {
  items: [
    {
      id: 'evt1',
      summary: 'Team Standup',
      status: 'confirmed',
      start: { dateTime: '2026-07-28T09:00:00-03:00' },
      location: 'Google Meet',
      description: 'Daily sync',
    },
    {
      id: 'evt2',
      summary: 'Design Review',
      status: 'tentative',
      start: { date: '2026-07-29' },
      location: 'Conference Room',
      description: 'Review mockups',
    },
    {
      id: 'evt3',
      summary: 'Private Meeting',
      status: 'confirmed',
      visibility: 'private',
      start: { dateTime: '2026-07-28T14:00:00-03:00' },
    },
  ],
};

describe('fetchAgenda', () => {
  const originalEnv = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;

  beforeEach(() => {
    mockFetch.mockReset();
    mockGetAccessToken.mockReset();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.GOOGLE_CALENDAR_REFRESH_TOKEN = originalEnv;
    } else {
      delete process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;
    }
  });

  it('returns error when refresh token is missing', async () => {
    delete process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;

    const result = await fetchAgenda();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('missing refresh token');
    }
  });

  it('fetches access token and calls Google Calendar API', async () => {
    process.env.GOOGLE_CALENDAR_REFRESH_TOKEN = 'test-token';
    mockGetAccessToken.mockResolvedValue('access-token-123');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCalendarResponse),
    });

    await fetchAgenda();

    expect(mockGetAccessToken).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('googleapis.com/calendar/v3'),
      expect.objectContaining({
        headers: { Authorization: 'Bearer access-token-123' },
      }),
    );
  });

  it('returns AgendaData with correct shape', async () => {
    process.env.GOOGLE_CALENDAR_REFRESH_TOKEN = 'test-token';
    mockGetAccessToken.mockResolvedValue('access-token-123');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCalendarResponse),
    });

    const result = await fetchAgenda();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.events).toHaveLength(3);
      expect(result.data.updatedAt).toBeDefined();
    }
  });

  it('maps event fields correctly', async () => {
    process.env.GOOGLE_CALENDAR_REFRESH_TOKEN = 'test-token';
    mockGetAccessToken.mockResolvedValue('access-token-123');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCalendarResponse),
    });

    const result = await fetchAgenda();
    expect(result.ok).toBe(true);
    if (result.ok) {
      const event = result.data.events[0];
      expect(event.id).toBe('evt1');
      expect(event.title).toBe('Team Standup');
      expect(event.date).toBe('2026-07-28');
      expect(event.time).toBe('09:00');
      expect(event.location).toBe('Google Meet');
      expect(event.description).toBe('Daily sync');
      expect(event.status).toBe('confirmed');
    }
  });

  it('hides private events', async () => {
    process.env.GOOGLE_CALENDAR_REFRESH_TOKEN = 'test-token';
    mockGetAccessToken.mockResolvedValue('access-token-123');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCalendarResponse),
    });

    const result = await fetchAgenda();
    expect(result.ok).toBe(true);
    if (result.ok) {
      const privateEvent = result.data.events.find((e) => e.id === 'evt3');
      expect(privateEvent).toBeDefined();
      expect(privateEvent!.title).toBe('Busy');
      expect(privateEvent!.location).toBe('');
      expect(privateEvent!.description).toBe('');
    }
  });

  it('handles all-day events', async () => {
    process.env.GOOGLE_CALENDAR_REFRESH_TOKEN = 'test-token';
    mockGetAccessToken.mockResolvedValue('access-token-123');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCalendarResponse),
    });

    const result = await fetchAgenda();
    expect(result.ok).toBe(true);
    if (result.ok) {
      const allDayEvent = result.data.events.find((e) => e.id === 'evt2');
      expect(allDayEvent).toBeDefined();
      expect(allDayEvent!.date).toBe('2026-07-29');
      expect(allDayEvent!.time).toBe('');
    }
  });

  it('returns error when access token fails', async () => {
    process.env.GOOGLE_CALENDAR_REFRESH_TOKEN = 'test-token';
    mockGetAccessToken.mockRejectedValue(new Error('Token refresh failed'));

    const result = await fetchAgenda();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('Token refresh failed');
    }
  });

  it('returns error on non-ok response from Google', async () => {
    process.env.GOOGLE_CALENDAR_REFRESH_TOKEN = 'test-token';
    mockGetAccessToken.mockResolvedValue('access-token-123');
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    });

    const result = await fetchAgenda();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('403');
    }
  });

  it('returns error on network failure', async () => {
    process.env.GOOGLE_CALENDAR_REFRESH_TOKEN = 'test-token';
    mockGetAccessToken.mockResolvedValue('access-token-123');
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await fetchAgenda();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Network error');
    }
  });
});
