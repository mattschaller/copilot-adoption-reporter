import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CopilotDayMetrics } from '../src/types.js';

vi.mock('@octokit/rest', () => {
  const mockOctokit = {
    request: vi.fn(),
    rest: {
      teams: {
        list: vi.fn(),
      },
    },
  };

  return {
    Octokit: vi.fn(function () { return mockOctokit; }),
    __mockOctokit: mockOctokit,
  };
});

async function getMock() {
  const mod = await import('@octokit/rest');
  return (mod as any).__mockOctokit;
}

describe('fetchOrgMetrics', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls the correct endpoint and returns metrics', async () => {
    const mock = await getMock();
    const metrics: CopilotDayMetrics[] = [
      { date: '2026-03-01', total_active_users: 10, total_engaged_users: 8 } as CopilotDayMetrics,
    ];
    mock.request.mockResolvedValue({ data: metrics });

    const { fetchOrgMetrics } = await import('../src/api.js');
    const result = await fetchOrgMetrics('my-org', 'ghp_token', '2026-03-01', '2026-03-10');

    expect(mock.request).toHaveBeenCalledWith(
      'GET /orgs/{org}/copilot/metrics',
      { org: 'my-org', since: '2026-03-01', until: '2026-03-10' },
    );
    expect(result).toEqual(metrics);
  });
});

describe('fetchTeamMetrics', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls the correct endpoint with team slug', async () => {
    const mock = await getMock();
    const metrics: CopilotDayMetrics[] = [
      { date: '2026-03-01', total_active_users: 5, total_engaged_users: 4 } as CopilotDayMetrics,
    ];
    mock.request.mockResolvedValue({ data: metrics });

    const { fetchTeamMetrics } = await import('../src/api.js');
    const result = await fetchTeamMetrics('my-org', 'eng-team', 'ghp_token', '2026-03-01', '2026-03-10');

    expect(mock.request).toHaveBeenCalledWith(
      'GET /orgs/{org}/team/{team_slug}/copilot/metrics',
      { org: 'my-org', team_slug: 'eng-team', since: '2026-03-01', until: '2026-03-10' },
    );
    expect(result).toEqual(metrics);
  });
});

describe('fetchTeams', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns team slugs from a single page', async () => {
    const mock = await getMock();
    mock.rest.teams.list.mockResolvedValue({
      data: [{ slug: 'alpha' }, { slug: 'beta' }],
    });

    const { fetchTeams } = await import('../src/api.js');
    const result = await fetchTeams('my-org', 'ghp_token');

    expect(result).toEqual(['alpha', 'beta']);
  });

  it('paginates when a full page is returned', async () => {
    const mock = await getMock();
    const fullPage = Array.from({ length: 100 }, (_, i) => ({ slug: `team-${i}` }));

    mock.rest.teams.list
      .mockResolvedValueOnce({ data: fullPage })
      .mockResolvedValueOnce({ data: [{ slug: 'last-team' }] });

    const { fetchTeams } = await import('../src/api.js');
    const result = await fetchTeams('my-org', 'ghp_token');

    expect(result).toHaveLength(101);
    expect(result[100]).toBe('last-team');
    expect(mock.rest.teams.list).toHaveBeenCalledTimes(2);
  });
});

describe('fetchSeats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns parsed seat data', async () => {
    const mock = await getMock();
    mock.request.mockResolvedValue({
      data: {
        seats: [
          {
            assignee: { login: 'alice' },
            last_activity_at: '2026-03-10T00:00:00Z',
            last_activity_editor: 'vscode',
            last_authenticated_at: '2026-03-10T00:00:00Z',
            created_at: '2026-01-01T00:00:00Z',
            plan_type: 'business',
            pending_cancellation_date: null,
          },
        ],
      },
    });

    const { fetchSeats } = await import('../src/api.js');
    const result = await fetchSeats('my-org', 'ghp_token');

    expect(result).toEqual([
      {
        login: 'alice',
        lastActivityAt: '2026-03-10T00:00:00Z',
        lastActivityEditor: 'vscode',
        lastAuthenticatedAt: '2026-03-10T00:00:00Z',
        createdAt: '2026-01-01T00:00:00Z',
        planType: 'business',
        pendingCancellationDate: null,
      },
    ]);
  });

  it('handles null activity fields', async () => {
    const mock = await getMock();
    mock.request.mockResolvedValue({
      data: {
        seats: [
          {
            assignee: { login: 'bob' },
            last_activity_at: null,
            last_activity_editor: null,
            last_authenticated_at: null,
            created_at: '2026-01-15T00:00:00Z',
            plan_type: 'enterprise',
            pending_cancellation_date: null,
          },
        ],
      },
    });

    const { fetchSeats } = await import('../src/api.js');
    const result = await fetchSeats('my-org', 'ghp_token');

    expect(result[0].lastActivityAt).toBeNull();
    expect(result[0].lastActivityEditor).toBeNull();
    expect(result[0].lastAuthenticatedAt).toBeNull();
  });

  it('paginates seat results', async () => {
    const mock = await getMock();
    const fullPage = Array.from({ length: 100 }, (_, i) => ({
      assignee: { login: `user-${i}` },
      last_activity_at: null,
      last_activity_editor: null,
      last_authenticated_at: null,
      created_at: '2026-01-01T00:00:00Z',
      plan_type: 'business',
      pending_cancellation_date: null,
    }));

    mock.request
      .mockResolvedValueOnce({ data: { seats: fullPage } })
      .mockResolvedValueOnce({ data: { seats: [{ assignee: { login: 'last' }, last_activity_at: null, last_activity_editor: null, last_authenticated_at: null, created_at: '2026-01-01T00:00:00Z', plan_type: 'business', pending_cancellation_date: null }] } });

    const { fetchSeats } = await import('../src/api.js');
    const result = await fetchSeats('my-org', 'ghp_token');

    expect(result).toHaveLength(101);
    expect(result[100].login).toBe('last');
  });
});
