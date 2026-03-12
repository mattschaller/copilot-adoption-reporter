import type { CopilotWeeklyRollup } from '../types.js';

export function formatJson(rollup: CopilotWeeklyRollup): string {
  return JSON.stringify(rollup, null, 2) + '\n';
}
