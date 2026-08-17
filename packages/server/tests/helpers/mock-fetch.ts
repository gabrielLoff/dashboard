import { vi } from 'vitest';

export function createMockFetch() {
  const mockFetch = vi.fn();
  vi.stubGlobal('fetch', mockFetch);
  return mockFetch;
}

export function mockFetchOk(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

export function mockFetchError(status: number, statusText: string) {
  return vi.fn().mockResolvedValue({ ok: false, status, statusText });
}

export function mockFetchNetworkError(message = 'Network error') {
  return vi.fn().mockRejectedValue(new Error(message));
}
