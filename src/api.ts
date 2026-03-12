import { Octokit } from '@octokit/rest';
import type { CopilotDayMetrics, CopilotSeat } from './types.js';

export async function fetchOrgMetrics(
  org: string,
  token: string,
  since: string,
  until: string,
): Promise<CopilotDayMetrics[]> {
  const octokit = new Octokit({ auth: token });
  const response = await octokit.request(
    'GET /orgs/{org}/copilot/metrics',
    { org, since, until },
  );
  return response.data as CopilotDayMetrics[];
}

export async function fetchTeamMetrics(
  org: string,
  teamSlug: string,
  token: string,
  since: string,
  until: string,
): Promise<CopilotDayMetrics[]> {
  const octokit = new Octokit({ auth: token });
  const response = await octokit.request(
    'GET /orgs/{org}/team/{team_slug}/copilot/metrics',
    { org, team_slug: teamSlug, since, until },
  );
  return response.data as CopilotDayMetrics[];
}

export async function fetchTeams(
  org: string,
  token: string,
): Promise<string[]> {
  const octokit = new Octokit({ auth: token });
  const teams: string[] = [];
  let page = 1;
  while (true) {
    const response = await octokit.rest.teams.list({
      org,
      per_page: 100,
      page,
    });
    for (const team of response.data) {
      teams.push(team.slug);
    }
    if (response.data.length < 100) break;
    page++;
  }
  return teams;
}

export async function fetchSeats(
  org: string,
  token: string,
): Promise<CopilotSeat[]> {
  const octokit = new Octokit({ auth: token });
  const seats: CopilotSeat[] = [];
  let page = 1;
  while (true) {
    const response = await octokit.request(
      'GET /orgs/{org}/copilot/billing/seats',
      { org, per_page: 100, page },
    );
    const data = response.data as { seats: Array<Record<string, unknown>> };
    for (const seat of data.seats) {
      const assignee = seat.assignee as Record<string, unknown>;
      seats.push({
        login: assignee.login as string,
        lastActivityAt: (seat.last_activity_at as string) ?? null,
        lastActivityEditor: (seat.last_activity_editor as string) ?? null,
        lastAuthenticatedAt: (seat.last_authenticated_at as string) ?? null,
        createdAt: seat.created_at as string,
        planType: seat.plan_type as string,
        pendingCancellationDate: (seat.pending_cancellation_date as string) ?? null,
      });
    }
    if (data.seats.length < 100) break;
    page++;
  }
  return seats;
}
