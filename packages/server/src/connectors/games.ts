import type { ApiResult, FreeGamesData } from '@dashboard/shared';
import { err } from '@dashboard/shared';

const BASE_URL = process.env.FREEGAMES_API_URL ?? 'https://www.gamerpower.com/api';

export const VALID_TYPES = ['game', 'loot', 'beta'] as const;
export const VALID_PLATFORMS = ['pc', 'steam', 'epic-games-store', 'gog', 'drm-free', 'itchio'] as const;

export type GameType = (typeof VALID_TYPES)[number];
export type GamePlatform = (typeof VALID_PLATFORMS)[number];

export interface GamesFilters {
  type?: GameType;
  platform?: GamePlatform;
  page?: number;
}

function parseEndDate(raw: string): string {
  if (!raw || raw === 'N/A') return '';
  return raw.split(' ')[0] ?? '';
}

function buildQueryParams(filters: GamesFilters): string {
  const params = new URLSearchParams();
  if (filters.platform) params.set('platform', filters.platform);
  if (filters.type) params.set('type', filters.type);
  return params.toString();
}

export async function fetchGames(filters: GamesFilters = {}): Promise<ApiResult<FreeGamesData>> {
  const page = filters.page ?? 1;
  const pageSize = 12;

  try {
    const query = buildQueryParams(filters);
    const url = `${BASE_URL}/giveaways${query ? `?${query}` : ''}`;
    const res = await fetch(url);

    if (!res.ok) {
      return err(`GamerPower API returned ${res.status}: ${res.statusText}`);
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

    const allGames = json.map((g) => ({
      id: String(g.id),
      title: g.title,
      platform: g.platforms,
      source: g.type,
      url: g.open_giveaway_url,
      expiryDate: parseEndDate(g.end_date),
      imageUrl: g.image,
    }));

    const totalResults = allGames.length;
    const start = (page - 1) * pageSize;
    const games = allGames.slice(start, start + pageSize);

    return {
      ok: true,
      data: {
        games,
        totalResults,
        page,
        pageSize,
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to fetch free games');
  }
}