import type { CopilotWeeklyRollup, CopilotSeat } from '../types.js';

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function delta(value: number, isPercent = false): string {
  if (isPercent) {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${(value * 100).toFixed(1)}pp`;
  }
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value}`;
}

export function formatMarkdown(rollup: CopilotWeeklyRollup, seats?: CopilotSeat[]): string {
  const lines: string[] = [];

  lines.push(`# Copilot Adoption Report: ${rollup.org}`);
  lines.push(`**Period:** ${rollup.periodStart} to ${rollup.periodEnd}`);
  lines.push('');

  // Headline table
  lines.push('| Metric | This Period | Prior Period | \u0394 |');
  lines.push('| --- | ---: | ---: | ---: |');

  if (rollup.delta) {
    const priorActive = rollup.totalActiveUsers - rollup.delta.activeUsers;
    const priorEngaged = rollup.totalEngagedUsers - rollup.delta.engagedUsers;
    const priorRate = rollup.acceptanceRate - rollup.delta.acceptanceRate;
    const priorSuggestions = rollup.suggestionsTotal - rollup.delta.suggestions;

    lines.push(`| Active Users (avg/day) | ${rollup.totalActiveUsers} | ${priorActive} | ${delta(rollup.delta.activeUsers)} |`);
    lines.push(`| Engaged Users (avg/day) | ${rollup.totalEngagedUsers} | ${priorEngaged} | ${delta(rollup.delta.engagedUsers)} |`);
    lines.push(`| Acceptance Rate | ${pct(rollup.acceptanceRate)} | ${pct(priorRate)} | ${delta(rollup.delta.acceptanceRate, true)} |`);
    lines.push(`| Suggestions | ${rollup.suggestionsTotal} | ${priorSuggestions} | ${delta(rollup.delta.suggestions)} |`);
    lines.push(`| Lines Accepted | ${rollup.linesAccepted} | — | — |`);
    lines.push(`| Chat Sessions | ${rollup.chatSessions} | — | — |`);
    lines.push(`| PR Summaries | ${rollup.prSummaries} | — | — |`);
  } else {
    lines.push(`| Active Users (avg/day) | ${rollup.totalActiveUsers} | — | — |`);
    lines.push(`| Engaged Users (avg/day) | ${rollup.totalEngagedUsers} | — | — |`);
    lines.push(`| Acceptance Rate | ${pct(rollup.acceptanceRate)} | — | — |`);
    lines.push(`| Suggestions | ${rollup.suggestionsTotal} | — | — |`);
    lines.push(`| Lines Accepted | ${rollup.linesAccepted} | — | — |`);
    lines.push(`| Chat Sessions | ${rollup.chatSessions} | — | — |`);
    lines.push(`| PR Summaries | ${rollup.prSummaries} | — | — |`);
  }

  // Team breakdown
  if (rollup.byTeam && rollup.byTeam.length > 0) {
    lines.push('');
    lines.push('## Teams');
    lines.push('');
    lines.push('| Team | Active Users | Engaged Users | Acceptance Rate | Suggestions | Lines Accepted |');
    lines.push('| --- | ---: | ---: | ---: | ---: | ---: |');
    for (const t of rollup.byTeam) {
      lines.push(`| ${t.team} | ${t.totalActiveUsers} | ${t.totalEngagedUsers} | ${pct(t.acceptanceRate)} | ${t.suggestionsTotal} | ${t.linesAccepted} |`);
    }
  }

  // Top languages and editors
  if (rollup.topLanguages.length > 0) {
    lines.push('');
    lines.push(`**Top Languages:** ${rollup.topLanguages.map((l) => `${l.name} (${l.acceptances} acceptances)`).join(', ')}`);
  }

  if (rollup.topEditors.length > 0) {
    lines.push('');
    lines.push(`**Top Editors:** ${rollup.topEditors.map((e) => `${e.name} (${e.users} users)`).join(', ')}`);
  }

  if (seats && seats.length > 0) {
    const now = new Date();
    const sorted = [...seats].sort((a, b) => {
      if (!a.lastActivityAt && !b.lastActivityAt) return 0;
      if (!a.lastActivityAt) return 1;
      if (!b.lastActivityAt) return -1;
      return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
    });

    lines.push('');
    lines.push('## Seats');
    lines.push('');
    lines.push('| User | Last Activity | Days Ago | Editor | Status |');
    lines.push('| --- | --- | ---: | --- | --- |');
    for (const seat of sorted) {
      const lastActivity = seat.lastActivityAt
        ? new Date(seat.lastActivityAt).toISOString().slice(0, 10)
        : 'Never';
      const daysAgo = seat.lastActivityAt
        ? Math.round((now.getTime() - new Date(seat.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const daysAgoStr = daysAgo !== null ? String(daysAgo) : '—';
      const editor = seat.lastActivityEditor ?? '—';
      const status = seat.pendingCancellationDate
        ? 'Cancelling'
        : daysAgo === null
          ? 'Inactive'
          : daysAgo > 14
            ? 'Inactive'
            : 'Active';
      lines.push(`| ${seat.login} | ${lastActivity} | ${daysAgoStr} | ${editor} | ${status} |`);
    }
  }

  lines.push('');
  return lines.join('\n');
}
