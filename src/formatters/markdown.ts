import type { CopilotWeeklyRollup } from '../types.js';

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

export function formatMarkdown(rollup: CopilotWeeklyRollup): string {
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

  lines.push('');
  return lines.join('\n');
}
