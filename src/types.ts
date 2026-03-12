export interface CopilotDayMetrics {
  date: string;
  total_active_users: number;
  total_engaged_users: number;
  copilot_ide_code_completions: {
    total_engaged_users: number;
    languages?: Array<{ name: string; total_engaged_users: number }>;
    editors?: Array<{
      name: string;
      total_engaged_users: number;
      models?: Array<{
        name: string;
        is_custom_model: boolean;
        total_engaged_users: number;
        languages?: Array<{
          name: string;
          total_engaged_users: number;
          total_code_suggestions: number;
          total_code_acceptances: number;
          total_code_lines_suggested: number;
          total_code_lines_accepted: number;
        }>;
      }>;
    }>;
  } | null;
  copilot_ide_chat: {
    total_engaged_users: number;
    editors?: Array<{
      name: string;
      total_engaged_users: number;
      models?: Array<{
        name: string;
        is_custom_model: boolean;
        total_engaged_users: number;
        total_chats: number;
        total_chat_insertion_events: number;
        total_chat_copy_events: number;
      }>;
    }>;
  } | null;
  copilot_dotcom_chat: {
    total_engaged_users: number;
    models?: Array<{
      name: string;
      is_custom_model: boolean;
      total_engaged_users: number;
      total_chats: number;
    }>;
  } | null;
  copilot_dotcom_pull_requests: {
    total_engaged_users: number;
    repositories?: Array<{
      name: string;
      total_engaged_users: number;
      models?: Array<{
        name: string;
        is_custom_model: boolean;
        total_pr_summaries_created: number;
        total_engaged_users: number;
      }>;
    }>;
  } | null;
}

export interface CopilotWeeklyRollup {
  org: string;
  periodStart: string;
  periodEnd: string;
  totalActiveUsers: number;
  totalEngagedUsers: number;
  suggestionsTotal: number;
  acceptancesTotal: number;
  linesSuggested: number;
  linesAccepted: number;
  acceptanceRate: number;
  chatSessions: number;
  prSummaries: number;
  topLanguages: Array<{ name: string; acceptances: number }>;
  topEditors: Array<{ name: string; users: number }>;
  delta: {
    activeUsers: number;
    engagedUsers: number;
    acceptanceRate: number;
    suggestions: number;
  } | null;
  byTeam?: TeamRollup[];
}

export interface TeamRollup {
  team: string;
  totalActiveUsers: number;
  totalEngagedUsers: number;
  suggestionsTotal: number;
  acceptancesTotal: number;
  linesSuggested: number;
  linesAccepted: number;
  acceptanceRate: number;
  chatSessions: number;
}
