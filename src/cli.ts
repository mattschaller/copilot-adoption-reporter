import { Command } from 'commander';

export interface CliOptions {
  org: string;
  token: string;
  teams: boolean;
  since: string;
  until: string;
  format: 'md' | 'csv' | 'json';
  out?: string;
}

export function createProgram(): Command {
  const program = new Command();

  program
    .name('copilot-adoption-reporter')
    .description('Fetch GitHub Copilot adoption metrics and output pipe-friendly reports')
    .version('0.1.0')
    .requiredOption('--org <org>', 'GitHub organization')
    .option('--token <token>', 'GitHub PAT (or set GITHUB_TOKEN)', process.env.GITHUB_TOKEN)
    .option('--teams', 'Include per-team breakdown', false)
    .option('--since <date>', 'Start date (YYYY-MM-DD)', defaultSince())
    .option('--until <date>', 'End date (YYYY-MM-DD)', defaultUntil())
    .option('--format <format>', 'Output format: md, csv, json', 'md')
    .option('--out <file>', 'Write to file instead of stdout');

  return program;
}

function defaultSince(): string {
  const d = new Date();
  d.setDate(d.getDate() - 28);
  return d.toISOString().slice(0, 10);
}

function defaultUntil(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
