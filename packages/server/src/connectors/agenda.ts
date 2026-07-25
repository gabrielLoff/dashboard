import type { ApiResult, AgendaData } from '@dashboard/shared';
import { err } from '@dashboard/shared';
import { isMockMode, getMockAgenda } from '../mock-data.ts';

const API_KEY = process.env.CALENDAR_API_KEY;

export async function fetchAgenda(): Promise<ApiResult<AgendaData>> {
  if (isMockMode() || !API_KEY) {
    return getMockAgenda();
  }

  try {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 86400000);
    const params = new URLSearchParams({
      key: API_KEY,
      timeMin: now.toISOString(),
      timeMax: sevenDaysLater.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    );

    if (!res.ok) {
      return err(`Google Calendar returned ${res.status}: ${res.statusText}`);
    }

    const json = (await res.json()) as {
      items: {
        id: string;
        summary: string;
        start: { dateTime?: string; date?: string };
        location?: string;
        description?: string;
      }[];
    };

    return {
      ok: true,
      data: {
        events: json.items.map((e, i) => ({
          id: e.id ?? String(i),
          title: e.summary ?? 'Untitled',
          date: e.start.dateTime
            ? e.start.dateTime.split('T')[0]!
            : e.start.date ?? '',
          time: e.start.dateTime
            ? e.start.dateTime.split('T')[1]?.slice(0, 5) ?? ''
            : '',
          location: e.location ?? '',
          description: e.description ?? '',
        })),
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to fetch agenda');
  }
}
