import type { CopilotDayMetrics, CopilotWeeklyRollup, TeamRollup } from './types.js';

interface Aggregated {
  totalActiveUsers: number;
  totalEngagedUsers: number;
  suggestionsTotal: number;
  acceptancesTotal: number;
  linesSuggested: number;
  linesAccepted: number;
  chatSessions: number;
  prSummaries: number;
  languageAcceptances: Map<string, number>;
  editorUsers: Map<string, number>;
}

function aggregateDays(days: CopilotDayMetrics[]): Aggregated {
  let totalActiveUsers = 0;
  let totalEngagedUsers = 0;
  let suggestionsTotal = 0;
  let acceptancesTotal = 0;
  let linesSuggested = 0;
  let linesAccepted = 0;
  let chatSessions = 0;
  let prSummaries = 0;
  const languageAcceptances = new Map<string, number>();
  const editorUsers = new Map<string, number>();

  for (const day of days) {
    totalActiveUsers += day.total_active_users;
    totalEngagedUsers += day.total_engaged_users;

    if (day.copilot_ide_code_completions) {
      for (const editor of day.copilot_ide_code_completions.editors ?? []) {
        editorUsers.set(
          editor.name,
          (editorUsers.get(editor.name) ?? 0) + editor.total_engaged_users,
        );
        for (const model of editor.models ?? []) {
          for (const lang of model.languages ?? []) {
            suggestionsTotal += lang.total_code_suggestions;
            acceptancesTotal += lang.total_code_acceptances;
            linesSuggested += lang.total_code_lines_suggested;
            linesAccepted += lang.total_code_lines_accepted;
            languageAcceptances.set(
              lang.name,
              (languageAcceptances.get(lang.name) ?? 0) + lang.total_code_acceptances,
            );
          }
        }
      }
    }

    if (day.copilot_ide_chat) {
      for (const editor of day.copilot_ide_chat.editors ?? []) {
        for (const model of editor.models ?? []) {
          chatSessions += model.total_chats;
        }
      }
    }

    if (day.copilot_dotcom_chat) {
      for (const model of day.copilot_dotcom_chat.models ?? []) {
        chatSessions += model.total_chats;
      }
    }

    if (day.copilot_dotcom_pull_requests) {
      for (const repo of day.copilot_dotcom_pull_requests.repositories ?? []) {
        for (const model of repo.models ?? []) {
          prSummaries += model.total_pr_summaries_created;
        }
      }
    }
  }

  const dayCount = days.length || 1;
  return {
    totalActiveUsers: Math.round(totalActiveUsers / dayCount),
    totalEngagedUsers: Math.round(totalEngagedUsers / dayCount),
    suggestionsTotal,
    acceptancesTotal,
    linesSuggested,
    linesAccepted,
    chatSessions,
    prSummaries,
    languageAcceptances,
    editorUsers,
  };
}

export function computeRollup(
  days: CopilotDayMetrics[],
  org: string,
  priorDays?: CopilotDayMetrics[],
): CopilotWeeklyRollup {
  const current = aggregateDays(days);

  const sortedDates = days.map((d) => d.date).sort();
  const periodStart = sortedDates[0] ?? '';
  const periodEnd = sortedDates[sortedDates.length - 1] ?? '';

  const acceptanceRate =
    current.linesSuggested > 0
      ? current.linesAccepted / current.linesSuggested
      : 0;

  const topLanguages = [...current.languageAcceptances.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, acceptances]) => ({ name, acceptances }));

  const topEditors = [...current.editorUsers.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, users]) => ({ name, users }));

  let delta: CopilotWeeklyRollup['delta'] = null;

  if (priorDays && priorDays.length > 0) {
    const prior = aggregateDays(priorDays);
    const priorAcceptanceRate =
      prior.linesSuggested > 0
        ? prior.linesAccepted / prior.linesSuggested
        : 0;

    delta = {
      activeUsers: current.totalActiveUsers - prior.totalActiveUsers,
      engagedUsers: current.totalEngagedUsers - prior.totalEngagedUsers,
      acceptanceRate: acceptanceRate - priorAcceptanceRate,
      suggestions: current.suggestionsTotal - prior.suggestionsTotal,
    };
  }

  return {
    org,
    periodStart,
    periodEnd,
    totalActiveUsers: current.totalActiveUsers,
    totalEngagedUsers: current.totalEngagedUsers,
    suggestionsTotal: current.suggestionsTotal,
    acceptancesTotal: current.acceptancesTotal,
    linesSuggested: current.linesSuggested,
    linesAccepted: current.linesAccepted,
    acceptanceRate,
    chatSessions: current.chatSessions,
    prSummaries: current.prSummaries,
    topLanguages,
    topEditors,
    delta,
  };
}

export function computeTeamRollup(
  days: CopilotDayMetrics[],
  team: string,
): TeamRollup {
  const agg = aggregateDays(days);
  return {
    team,
    totalActiveUsers: agg.totalActiveUsers,
    totalEngagedUsers: agg.totalEngagedUsers,
    suggestionsTotal: agg.suggestionsTotal,
    acceptancesTotal: agg.acceptancesTotal,
    linesSuggested: agg.linesSuggested,
    linesAccepted: agg.linesAccepted,
    acceptanceRate:
      agg.linesSuggested > 0 ? agg.linesAccepted / agg.linesSuggested : 0,
    chatSessions: agg.chatSessions,
  };
}
