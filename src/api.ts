import { Octokit } from '@octokit/rest';
import type { CopilotDayMetrics } from './types.js';

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
