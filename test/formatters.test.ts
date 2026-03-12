import { describe, it, expect } from 'vitest';
import { formatMarkdown } from '../src/formatters/markdown.js';
import { formatCsv } from '../src/formatters/csv.js';
import { formatJson } from '../src/formatters/json.js';
import type { CopilotWeeklyRollup, CopilotDayMetrics } from '../src/types.js';

function makeRollup(overrides: Partial<CopilotWeeklyRollup> = {}): CopilotWeeklyRollup {
  return {
    org: 'test-org',
    periodStart: '2026-03-01',
    periodEnd: '2026-03-07',
    totalActiveUsers: 100,
    totalEngagedUsers: 80,
    suggestionsTotal: 5000,
    acceptancesTotal: 1500,
    linesSuggested: 10000,
    linesAccepted: 3000,
    acceptanceRate: 0.3,
    chatSessions: 200,
    prSummaries: 15,
    topLanguages: [
      { name: 'TypeScript', acceptances: 800 },
      { name: 'Python', acceptances: 400 },
    ],
    topEditors: [
      { name: 'VS Code', users: 70 },
      { name: 'JetBrains', users: 10 },
    ],
    delta: null,
    ...overrides,
  };
}

function makeDay(date: string): CopilotDayMetrics {
  return {
    date,
    total_active_users: 50,
    total_engaged_users: 40,
    copilot_ide_code_completions: {
      total_engaged_users: 30,
      editors: [{
        name: 'vscode',
        total_engaged_users: 30,
        models: [{
          name: 'default',
          is_custom_model: false,
          total_engaged_users: 30,
          languages: [{
            name: 'typescript',
            total_engaged_users: 30,
            total_code_suggestions: 100,
            total_code_acceptances: 30,
            total_code_lines_suggested: 200,
            total_code_lines_accepted: 60,
          }],
        }],
      }],
    },
    copilot_ide_chat: null,
    copilot_dotcom_chat: null,
    copilot_dotcom_pull_requests: null,
  };
}

describe('formatMarkdown', () => {
  it('has headline table with delta column', () => {
    const rollup = makeRollup({
      delta: {
        activeUsers: 10,
        engagedUsers: 5,
        acceptanceRate: 0.05,
        suggestions: 500,
      },
    });
    const md = formatMarkdown(rollup);
    expect(md).toContain('| Metric | This Period | Prior Period |');
    expect(md).toContain('| Active Users (avg/day) | 100 | 90 | +10 |');
    expect(md).toContain('+5.0pp');
  });

  it('includes team breakdown when byTeam present', () => {
    const rollup = makeRollup({
      byTeam: [
        {
          team: 'frontend',
          totalActiveUsers: 30,
          totalEngagedUsers: 25,
          suggestionsTotal: 2000,
          acceptancesTotal: 600,
          linesSuggested: 4000,
          linesAccepted: 1200,
          acceptanceRate: 0.3,
          chatSessions: 50,
        },
      ],
    });
    const md = formatMarkdown(rollup);
    expect(md).toContain('## Teams');
    expect(md).toContain('| frontend |');
  });

  it('handles rollup without delta or teams', () => {
    const md = formatMarkdown(makeRollup());
    expect(md).toContain('# Copilot Adoption Report: test-org');
    expect(md).toContain('| Active Users (avg/day) | 100 | — | — |');
    expect(md).not.toContain('## Teams');
  });
});

describe('formatCsv', () => {
  it('has correct header and one row per day', () => {
    const days = [makeDay('2026-03-01'), makeDay('2026-03-02')];
    const csv = formatCsv({ days });
    const lines = csv.trim().split('\n');
    expect(lines[0]).toBe('date,active_users,engaged_users,suggestions,acceptances,lines_suggested,lines_accepted,chats,pr_summaries');
    expect(lines).toHaveLength(3); // header + 2 rows
    expect(lines[1]).toMatch(/^2026-03-01,/);
  });

  it('includes team column when teamDays provided', () => {
    const teamDays = [{ team: 'frontend', days: [makeDay('2026-03-01')] }];
    const csv = formatCsv({ days: [], teamDays });
    const lines = csv.trim().split('\n');
    expect(lines[0]).toContain(',team,');
    expect(lines[1]).toContain(',frontend,');
  });
});

describe('formatJson', () => {
  it('is valid JSON matching rollup shape', () => {
    const rollup = makeRollup();
    const json = formatJson(rollup);
    const parsed = JSON.parse(json);
    expect(parsed.org).toBe('test-org');
    expect(parsed.suggestionsTotal).toBe(5000);
    expect(parsed.topLanguages).toHaveLength(2);
  });

  it('handles minimal rollup data', () => {
    const rollup = makeRollup({
      suggestionsTotal: 0,
      acceptancesTotal: 0,
      topLanguages: [],
      topEditors: [],
    });
    const json = formatJson(rollup);
    const parsed = JSON.parse(json);
    expect(parsed.suggestionsTotal).toBe(0);
    expect(parsed.topLanguages).toHaveLength(0);
  });
});
