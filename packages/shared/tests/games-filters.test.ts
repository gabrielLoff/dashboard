import { describe, it, expectTypeOf } from 'vitest';
import type { GameType, GamePlatform, GamesFilters } from '../src/api-types';

describe('GameType', () => {
  it('accepts valid values', () => {
    expectTypeOf<GameType>().toEqualTypeOf<'game' | 'loot' | 'beta'>();
  });
});

describe('GamePlatform', () => {
  it('accepts valid values', () => {
    expectTypeOf<GamePlatform>().toEqualTypeOf<
      'pc' | 'steam' | 'epic-games-store' | 'gog' | 'drm-free' | 'itchio'
    >();
  });
});

describe('GamesFilters', () => {
  it('allows all fields to be optional', () => {
    const empty: GamesFilters = {};
    expectTypeOf(empty).toMatchTypeOf<GamesFilters>();
  });

  it('accepts typed fields', () => {
    const full: GamesFilters = { type: 'game', platform: 'steam', page: 2 };
    expectTypeOf(full).toMatchTypeOf<GamesFilters>();
  });
});
