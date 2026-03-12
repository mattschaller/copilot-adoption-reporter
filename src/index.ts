import { writeFileSync } from 'node:fs';
import { createProgram } from './cli.js';
import type { CliOptions } from './cli.js';
import { fetchOrgMetrics, fetchTeamMetrics, fetchTeams, fetchSeats } from './api.js';
import { computeRollup, computeTeamRollup } from './rollup.js';
import { formatMarkdown } from './formatters/markdown.js';
import { formatCsv, formatSeatsCsv } from './formatters/csv.js';
import { formatJson } from './formatters/json.js';
import type { CopilotDayMetrics, CopilotSeat } from './types.js';

async function main() {
  const program = createProgram();
  program.parse();
  const opts = program.opts<CliOptions>();

  if (!opts.token) {
    console.error('Error: --token or GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }

  const since = new Date(opts.since);
  const until = new Date(opts.until);
  const periodDays = Math.round((until.getTime() - since.getTime()) / (1000 * 60 * 60 * 24));

  // Fetch current period
  const currentDays = await fetchOrgMetrics(opts.org, opts.token, opts.since, opts.until);

  // Fetch prior period for delta (if within 28-day API limit)
  let priorDays: CopilotDayMetrics[] | undefined;
  const priorSince = new Date(since);
  priorSince.setDate(priorSince.getDate() - periodDays);
  const priorUntil = new Date(since);
  priorUntil.setDate(priorUntil.getDate() - 1);

  const totalSpan = Math.round((until.getTime() - priorSince.getTime()) / (1000 * 60 * 60 * 24));
  if (totalSpan <= 28) {
    try {
      priorDays = await fetchOrgMetrics(
        opts.org,
        opts.token,
        priorSince.toISOString().slice(0, 10),
        priorUntil.toISOString().slice(0, 10),
      );
    } catch {
      // Prior period unavailable, delta will be null
    }
  }

  // Compute rollup
  const rollup = computeRollup(currentDays, opts.org, priorDays);

  // Fetch team data if requested
  let teamDays: Array<{ team: string; days: CopilotDayMetrics[] }> | undefined;
  if (opts.teams) {
    const teamSlugs = await fetchTeams(opts.org, opts.token);
    teamDays = [];
    rollup.byTeam = [];
    for (const slug of teamSlugs) {
      try {
        const days = await fetchTeamMetrics(opts.org, slug, opts.token, opts.since, opts.until);
        teamDays.push({ team: slug, days });
        rollup.byTeam.push(computeTeamRollup(days, slug));
      } catch {
        // Team may not have Copilot data, skip
      }
    }
  }

  // Fetch seat data if requested
  let seats: CopilotSeat[] | undefined;
  if (opts.seats) {
    seats = await fetchSeats(opts.org, opts.token);
  }

  // Format output
  let output: string;
  if (opts.seats && seats) {
    switch (opts.format) {
      case 'csv':
        output = formatSeatsCsv(seats);
        break;
      case 'json':
        output = JSON.stringify(seats, null, 2) + '\n';
        break;
      case 'md':
      default:
        output = formatMarkdown(rollup, seats);
        break;
    }
  } else {
    switch (opts.format) {
      case 'csv':
        output = formatCsv({ days: currentDays, teamDays });
        break;
      case 'json':
        output = formatJson(rollup);
        break;
      case 'md':
      default:
        output = formatMarkdown(rollup);
        break;
    }
  }

  // Write output
  if (opts.out) {
    writeFileSync(opts.out, output);
    console.error(`Report written to ${opts.out}`);
  } else {
    process.stdout.write(output);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
