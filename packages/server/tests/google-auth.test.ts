import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getAccessToken, resetTokenCache } from '../src/lib/google-auth.ts';

const originalEnv = process.env;

beforeEach(() => {
  vi.restoreAllMocks();
  resetTokenCache();
  process.env = { ...originalEnv };
  vi.useFakeTimers();
});

afterEach(() => {
  process.env = originalEnv;
  vi.useRealTimers();
});

describe('getAccessToken', () => {
  it('throws when env vars are missing', async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;

    await expect(getAccessToken()).rejects.toThrow(
      'Missing Google OAuth credentials',
    );
  });

  it('exchanges refresh token and caches the access token', async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_CALENDAR_REFRESH_TOKEN = 'test-refresh-token';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'test-access-token',
        expires_in: 3600,
        token_type: 'Bearer',
      }),
    });

    const token = await getAccessToken();
    expect(token).toBe('test-access-token');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    const secondToken = await getAccessToken();
    expect(secondToken).toBe('test-access-token');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('refreshes proactively within 5 minutes of expiry', async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_CALENDAR_REFRESH_TOKEN = 'test-refresh-token';

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'first-token',
          expires_in: 600,
          token_type: 'Bearer',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'refreshed-token',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      });

    const first = await getAccessToken();
    expect(first).toBe('first-token');

    vi.advanceTimersByTime(301_000);

    const second = await getAccessToken();
    expect(second).toBe('refreshed-token');
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('does not refresh when well before expiry', async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_CALENDAR_REFRESH_TOKEN = 'test-refresh-token';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'cached-token',
        expires_in: 3600,
        token_type: 'Bearer',
      }),
    });

    await getAccessToken();
    vi.advanceTimersByTime(60_000);

    const second = await getAccessToken();
    expect(second).toBe('cached-token');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('forces refresh when invalidateToken is true', async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_CALENDAR_REFRESH_TOKEN = 'test-refresh-token';

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'first-token',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'forced-token',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      });

    const first = await getAccessToken();
    expect(first).toBe('first-token');

    const second = await getAccessToken({ invalidateToken: true });
    expect(second).toBe('forced-token');
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('throws on non-ok response from Google', async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_CALENDAR_REFRESH_TOKEN = 'test-refresh-token';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'invalid_grant',
    });

    await expect(getAccessToken()).rejects.toThrow(
      'Google OAuth token exchange failed: 400',
    );
  });
});
