import { describe, it, expect } from 'vitest';
import { computeRollup, computeTeamRollup } from '../src/rollup.js';
import type { CopilotDayMetrics } from '../src/types.js';

function makeDay(overrides: Partial<CopilotDayMetrics> = {}): CopilotDayMetrics {
  return {
    date: '2026-03-01',
    total_active_users: 100,
    total_engaged_users: 80,
    copilot_ide_code_completions: {
      total_engaged_users: 60,
      editors: [
        {
          name: 'vscode',
          total_engaged_users: 50,
          models: [
            {
              name: 'default',
              is_custom_model: false,
              total_engaged_users: 50,
              languages: [
                {
                  name: 'typescript',
                  total_engaged_users: 30,
                  total_code_suggestions: 200,
                  total_code_acceptances: 60,
                  total_code_lines_suggested: 400,
                  total_code_lines_accepted: 120,
                },
                {
                  name: 'python',
                  total_engaged_users: 20,
                  total_code_suggestions: 100,
                  total_code_acceptances: 40,
                  total_code_lines_suggested: 200,
                  total_code_lines_accepted: 80,
                },
              ],
            },
          ],
        },
        {
          name: 'jetbrains',
          total_engaged_users: 10,
          models: [
            {
              name: 'default',
              is_custom_model: false,
              total_engaged_users: 10,
              languages: [
                {
                  name: 'java',
                  total_engaged_users: 10,
                  total_code_suggestions: 50,
                  total_code_acceptances: 15,
                  total_code_lines_suggested: 100,
                  total_code_lines_accepted: 30,
                },
              ],
            },
          ],
        },
      ],
    },
    copilot_ide_chat: {
      total_engaged_users: 30,
      editors: [
        {
          name: 'vscode',
          total_engaged_users: 30,
          models: [
            {
              name: 'default',
              is_custom_model: false,
              total_engaged_users: 30,
              total_chats: 150,
              total_chat_insertion_events: 50,
              total_chat_copy_events: 30,
            },
          ],
        },
      ],
    },
    copilot_dotcom_chat: {
      total_engaged_users: 10,
      models: [
        {
          name: 'default',
          is_custom_model: false,
          total_engaged_users: 10,
          total_chats: 25,
        },
      ],
    },
    copilot_dotcom_pull_requests: {
      total_engaged_users: 5,
      repositories: [
        {
          name: 'my-repo',
          total_engaged_users: 5,
          models: [
            {
              name: 'default',
              is_custom_model: false,
              total_pr_summaries_created: 8,
              total_engaged_users: 5,
            },
          ],
        },
      ],
    },
    ...overrides,
  };
}

describe('computeRollup', () => {
  it('aggregates suggestions and acceptances across editors/models/languages', () => {
    const rollup = computeRollup([makeDay()], 'test-org');
    // vscode: ts(200+100) + jetbrains: java(50) = 350 suggestions
    expect(rollup.suggestionsTotal).toBe(350);
    // vscode: ts(60+40) + jetbrains: java(15) = 115 acceptances
    expect(rollup.acceptancesTotal).toBe(115);
    // lines: ts(400+200) + java(100) = 700
    expect(rollup.linesSuggested).toBe(700);
    // lines accepted: ts(120+80) + java(30) = 230
    expect(rollup.linesAccepted).toBe(230);
  });

  it('computes correct acceptance rate', () => {
    const rollup = computeRollup([makeDay()], 'test-org');
    // 230 / 700
    expect(rollup.acceptanceRate).toBeCloseTo(230 / 700);
  });

  it('handles null copilot_ide_code_completions', () => {
    const day = makeDay({ copilot_ide_code_completions: null });
    const rollup = computeRollup([day], 'test-org');
    expect(rollup.suggestionsTotal).toBe(0);
    expect(rollup.acceptancesTotal).toBe(0);
    expect(rollup.acceptanceRate).toBe(0);
  });

  it('computes delta when prior period provided', () => {
    const current = makeDay({ date: '2026-03-08' });
    const prior = makeDay({ date: '2026-03-01', total_active_users: 90, total_engaged_users: 70 });
    const rollup = computeRollup([current], 'test-org', [prior]);
    expect(rollup.delta).not.toBeNull();
    expect(rollup.delta!.activeUsers).toBe(10); // 100 - 90
    expect(rollup.delta!.engagedUsers).toBe(10); // 80 - 70
    expect(rollup.delta!.suggestions).toBe(0); // same suggestions
  });

  it('returns null delta when no prior period', () => {
    const rollup = computeRollup([makeDay()], 'test-org');
    expect(rollup.delta).toBeNull();
  });

  it('identifies top 3 languages by acceptances', () => {
    const rollup = computeRollup([makeDay()], 'test-org');
    expect(rollup.topLanguages).toHaveLength(3);
    expect(rollup.topLanguages[0].name).toBe('typescript');
    expect(rollup.topLanguages[0].acceptances).toBe(60);
    expect(rollup.topLanguages[1].name).toBe('python');
    expect(rollup.topLanguages[2].name).toBe('java');
  });

  it('identifies top 3 editors by engaged users', () => {
    const rollup = computeRollup([makeDay()], 'test-org');
    expect(rollup.topEditors).toHaveLength(2); // only 2 editors in fixture
    expect(rollup.topEditors[0].name).toBe('vscode');
    expect(rollup.topEditors[0].users).toBe(50);
    expect(rollup.topEditors[1].name).toBe('jetbrains');
  });

  it('handles empty days array', () => {
    const rollup = computeRollup([], 'test-org');
    expect(rollup.totalActiveUsers).toBe(0);
    expect(rollup.suggestionsTotal).toBe(0);
    expect(rollup.acceptanceRate).toBe(0);
    expect(rollup.topLanguages).toHaveLength(0);
    expect(rollup.periodStart).toBe('');
    expect(rollup.periodEnd).toBe('');
  });
});

describe('computeTeamRollup', () => {
  it('computes team rollup with correct values', () => {
    const rollup = computeTeamRollup([makeDay()], 'engineering');
    expect(rollup.team).toBe('engineering');
    expect(rollup.suggestionsTotal).toBe(350);
    expect(rollup.chatSessions).toBe(175); // 150 + 25
  });
});
