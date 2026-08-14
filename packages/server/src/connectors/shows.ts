import type { ApiResult, ShowSearchResult, UpcomingEpisode, SeasonPremiere, UpcomingEntry, ShowsData, EpisodeListEntry } from '@dashboard/shared';
import { err } from '@dashboard/shared';

const BASE_URL = 'https://api.tvmaze.com';

interface TvMazeShow {
  id: number;
  name: string;
  status: string;
  premiered?: string;
  ended?: string;
  image?: { medium: string; original: string } | null;
  network?: { name: string } | null;
  webChannel?: { name: string } | null;
  summary?: string;
  _links?: {
    nextepisode?: { href: string };
  };
}

interface TvMazeSearchResult {
  score: number;
  show: TvMazeShow;
}

interface TvMazeEpisode {
  id: number;
  name: string;
  season: number;
  number: number;
  airdate: string;
  airtime: string;
  runtime: number;
  image?: { medium: string; original: string } | null;
}

interface TvMazeSeason {
  id: number;
  number: number;
  premiereDate: string | null;
  endDate: string | null;
}

function normalizeShow(show: TvMazeShow): ShowSearchResult {
  return {
    id: show.id,
    name: show.name,
    status: show.status,
    premiered: show.premiered,
    ended: show.ended,
    image: show.image ?? undefined,
    network: show.network,
    webChannel: show.webChannel,
    summary: show.summary,
  };
}

function oneMonthAgo(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d;
}

async function fetchJson<T>(url: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return err(`TVmaze returned ${res.status}: ${res.statusText}`);
    }
    const json = (await res.json()) as T;
    return { ok: true, data: json };
  } catch (e) {
    return err(e instanceof Error ? e.message : `Failed to fetch ${url}`);
  }
}

export async function searchShows(query: string): Promise<ApiResult<ShowSearchResult[]>> {
  if (!query.trim()) {
    return { ok: true, data: [] };
  }

  const result = await fetchJson<TvMazeSearchResult[]>(
    `${BASE_URL}/search/shows?q=${encodeURIComponent(query)}`,
  );

  if (!result.ok) return result;

  const shows = result.data
    .slice(0, 10)
    .map((r) => normalizeShow(r.show));

  return { ok: true, data: shows };
}

async function fetchNextEpisodeForShow(showId: number): Promise<UpcomingEntry | null> {
  const showResult = await fetchJson<TvMazeShow>(
    `${BASE_URL}/shows/${showId}?embed=nextepisode`,
  );

  if (!showResult.ok) return null;

  const show = showResult.data;

  if (show.status === 'Ended' && show.ended) {
    const ended = new Date(show.ended);
    if (ended < oneMonthAgo()) {
      return null;
    }
  }

  const nextEpisode = (show as TvMazeShow & { _embedded?: { nextepisode?: TvMazeEpisode } })._embedded?.nextepisode;

  if (nextEpisode) {
    return {
      showId: show.id,
      showName: show.name,
      season: nextEpisode.season,
      number: nextEpisode.number,
      title: nextEpisode.name,
      airdate: nextEpisode.airdate,
      airtime: nextEpisode.airtime,
      runtime: nextEpisode.runtime,
      image: nextEpisode.image?.medium,
    };
  }

  if (show.status === 'Running' || show.status === 'To Be Determined') {
    const seasonsResult = await fetchJson<TvMazeSeason[]>(
      `${BASE_URL}/shows/${showId}/seasons`,
    );

    if (seasonsResult.ok) {
      const today = new Date().toISOString().split('T')[0];
      const futureSeason = seasonsResult.data.find(
        (s) => s.premiereDate && s.premiereDate > today,
      );

      if (futureSeason) {
        return {
          showId: show.id,
          showName: show.name,
          season: futureSeason.number,
          premiereDate: futureSeason.premiereDate,
          image: show.image?.medium,
        };
      }
    }
  }

  return null;
}

export async function getUpcomingEpisodes(ids: number[]): Promise<ApiResult<ShowsData>> {
  if (ids.length === 0) {
    return { ok: true, data: { upcoming: [], updatedAt: new Date().toISOString() } };
  }

  const entries = await Promise.all(ids.map(fetchNextEpisodeForShow));

  const upcoming = entries
    .filter((e): e is UpcomingEntry => e !== null)
    .sort((a, b) => {
      const dateA = isUpcomingEpisodeEntry(a) ? a.airdate : (a.premiereDate ?? '');
      const dateB = isUpcomingEpisodeEntry(b) ? b.airdate : (b.premiereDate ?? '');
      return dateA.localeCompare(dateB);
    });

  return {
    ok: true,
    data: {
      upcoming,
      updatedAt: new Date().toISOString(),
    },
  };
}

function isUpcomingEpisodeEntry(entry: UpcomingEntry): entry is UpcomingEpisode {
  return 'number' in entry;
}

export async function fetchEpisodes(showId: number): Promise<ApiResult<EpisodeListEntry[]>> {
  const result = await fetchJson<TvMazeEpisode[]>(
    `${BASE_URL}/shows/${showId}/episodes`,
  );

  if (!result.ok) return result;

  const episodes = result.data.map((ep) => ({
    season: ep.season,
    number: ep.number,
    name: ep.name,
    airdate: ep.airdate || undefined,
  }));

  return { ok: true, data: episodes };
}
