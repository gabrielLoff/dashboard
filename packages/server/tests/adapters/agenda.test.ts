import { describe, it, expect, vi } from 'vitest';
import { mockAgendaFetcher } from '../../src/adapters/agenda.ts';

vi.mock('../../src/mock-data.ts', () => ({
  getMockAgenda: vi.fn(() => ({
    ok: true,
    data: {
      events: [
        {
          id: '1',
          title: 'Test Event',
          date: '2025-06-01',
          time: '10:00',
          location: 'Online',
          description: 'A test event.',
          status: 'confirmed',
        },
      ],
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
  })),
}));

describe('mockAgendaFetcher', () => {
  it('returns a successful agenda result', async () => {
    const result = await mockAgendaFetcher.fetch();
    expect(result.ok).toBe(true);
  });

  it('returns AgendaData with expected shape', async () => {
    const result = await mockAgendaFetcher.fetch();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveProperty('events');
      expect(result.data).toHaveProperty('updatedAt');
      expect(Array.isArray(result.data.events)).toBe(true);
    }
  });

  it('returns fixture data from getMockAgenda', async () => {
    const result = await mockAgendaFetcher.fetch();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.events[0].title).toBe('Test Event');
    }
  });
});