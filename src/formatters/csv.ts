import type { CopilotDayMetrics, CopilotSeat } from '../types.js';

interface CsvOptions {
  days: CopilotDayMetrics[];
  teamDays?: Array<{ team: string; days: CopilotDayMetrics[] }>;
}

function aggregateDay(day: CopilotDayMetrics) {
  let suggestions = 0;
  let acceptances = 0;
  let linesSuggested = 0;
  let linesAccepted = 0;
  let chats = 0;
  let prSummaries = 0;

  if (day.copilot_ide_code_completions) {
    for (const editor of day.copilot_ide_code_completions.editors ?? []) {
      for (const model of editor.models ?? []) {
        for (const lang of model.languages ?? []) {
          suggestions += lang.total_code_suggestions;
          acceptances += lang.total_code_acceptances;
          linesSuggested += lang.total_code_lines_suggested;
          linesAccepted += lang.total_code_lines_accepted;
        }
      }
    }
  }

  if (day.copilot_ide_chat) {
    for (const editor of day.copilot_ide_chat.editors ?? []) {
      for (const model of editor.models ?? []) {
        chats += model.total_chats;
      }
    }
  }

  if (day.copilot_dotcom_chat) {
    for (const model of day.copilot_dotcom_chat.models ?? []) {
      chats += model.total_chats;
    }
  }

  if (day.copilot_dotcom_pull_requests) {
    for (const repo of day.copilot_dotcom_pull_requests.repositories ?? []) {
      for (const model of repo.models ?? []) {
        prSummaries += model.total_pr_summaries_created;
      }
    }
  }

  return {
    active_users: day.total_active_users,
    engaged_users: day.total_engaged_users,
    suggestions,
    acceptances,
    lines_suggested: linesSuggested,
    lines_accepted: linesAccepted,
    chats,
    pr_summaries: prSummaries,
  };
}

export function formatSeatsCsv(seats: CopilotSeat[]): string {
  const lines: string[] = [];
  lines.push('login,last_activity_at,last_activity_editor,last_authenticated_at,created_at,plan_type,status');
  const now = new Date();
  for (const seat of seats) {
    const daysAgo = seat.lastActivityAt
      ? Math.round((now.getTime() - new Date(seat.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const status = seat.pendingCancellationDate
      ? 'cancelling'
      : daysAgo === null
        ? 'inactive'
        : daysAgo > 14
          ? 'inactive'
          : 'active';
    lines.push(`${seat.login},${seat.lastActivityAt ?? ''},${seat.lastActivityEditor ?? ''},${seat.lastAuthenticatedAt ?? ''},${seat.createdAt},${seat.planType},${status}`);
  }
  lines.push('');
  return lines.join('\n');
}

export function formatCsv(options: CsvOptions): string {
  const { days, teamDays } = options;
  const lines: string[] = [];

  if (teamDays && teamDays.length > 0) {
    lines.push('date,team,active_users,engaged_users,suggestions,acceptances,lines_suggested,lines_accepted,chats,pr_summaries');
    for (const { team, days: tDays } of teamDays) {
      for (const day of tDays) {
        const agg = aggregateDay(day);
        lines.push(`${day.date},${team},${agg.active_users},${agg.engaged_users},${agg.suggestions},${agg.acceptances},${agg.lines_suggested},${agg.lines_accepted},${agg.chats},${agg.pr_summaries}`);
      }
    }
  } else {
    lines.push('date,active_users,engaged_users,suggestions,acceptances,lines_suggested,lines_accepted,chats,pr_summaries');
    for (const day of days) {
      const agg = aggregateDay(day);
      lines.push(`${day.date},${agg.active_users},${agg.engaged_users},${agg.suggestions},${agg.acceptances},${agg.lines_suggested},${agg.lines_accepted},${agg.chats},${agg.pr_summaries}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}
