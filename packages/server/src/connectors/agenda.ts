import type { ApiResult, AgendaData } from '@dashboard/shared';
import { err } from '@dashboard/shared';
import { isMockMode, getMockAgenda } from '../mock-data.ts';
import { getAccessToken } from '../lib/google-auth.ts';

const REFRESH_TOKEN = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;

const CALENDAR_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

interface GoogleEvent {
  id: string;
  summary: string;
  status: string;
  visibility?: string;
  start: { dateTime?: string; date?: string };
  location?: string;
  description?: string;
}

export async function fetchAgenda(): Promise<ApiResult<AgendaData>> {
  if (isMockMode() || !REFRESH_TOKEN) {
    return getMockAgenda();
  }

  try {
    const accessToken = await getAccessToken();

    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 86400000);

    const params = new URLSearchParams({
      timeMin: now.toISOString(),
      timeMax: threeDaysLater.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '20',
    });

    const res = await fetch(`${CALENDAR_URL}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      return err(`Google Calendar returned ${res.status}: ${res.statusText}`);
    }

    const json = (await res.json()) as { items: GoogleEvent[] };

    return {
      ok: true,
      data: {
        events: json.items.map((e, i) => {
          const isPrivate = e.visibility === 'private' || e.visibility === 'confidential';
          return {
            id: e.id || String(i),
            title: isPrivate ? 'Busy' : (e.summary || 'Untitled'),
            date: e.start.dateTime
              ? e.start.dateTime.split('T')[0]
              : e.start.date ?? '',
            time: e.start.dateTime
              ? e.start.dateTime.split('T')[1]?.slice(0, 5) ?? ''
              : '',
            location: isPrivate ? '' : (e.location ?? ''),
            description: isPrivate ? '' : (e.description ?? ''),
            status: e.status as 'confirmed' | 'tentative' | 'cancelled',
          };
        }),
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to fetch agenda');
  }
}
