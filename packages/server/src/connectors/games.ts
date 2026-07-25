import type { ApiResult, FreeGamesData } from '@dashboard/shared';
import { err } from '@dashboard/shared';
import { isMockMode, getMockGames } from '../mock-data.ts';

const API_KEY = process.env.FREEGAMES_API_KEY;
const BASE_URL = process.env.FREEGAMES_API_URL ?? 'https://www.gamerpower.com/api';

export async function fetchGames(): Promise<ApiResult<FreeGamesData>> {
  if (isMockMode() || !API_KEY) {
    return getMockGames();
  }

  try {
    const res = await fetch(`${BASE_URL}/giveaways?platform=pc`);

    if (!res.ok) {
      return err(`Free Games API returned ${res.status}: ${res.statusText}`);
    }

    const json = (await res.json()) as {
      id: number;
      title: string;
      platforms: string;
      type: string;
      open_giveaway_url: string;
      end_date: string;
      image: string;
    }[];

    return {
      ok: true,
      data: {
        games: json.slice(0, 6).map((g) => ({
          id: String(g.id),
          title: g.title,
          platform: g.platforms,
          source: g.type,
          url: g.open_giveaway_url,
          expiryDate: g.end_date.split(' ')[0] ?? '',
          imageUrl: g.image,
        })),
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to fetch free games');
  }
}
