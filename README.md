# copilot-adoption-reporter

CLI that fetches GitHub Copilot org/team adoption metrics and outputs pipe-friendly Markdown, CSV, or JSON reports.

## Why

GitHub's Copilot metrics API (`/orgs/{org}/copilot/metrics`) sunsets **April 2, 2026**. There's no lightweight CLI to pull daily metrics, compute weekly rollups with deltas, and pipe them into reports. Existing tools are all web dashboards or GitHub Actions — none are pipe-friendly.

## Install

```bash
npm install -g copilot-adoption-reporter
```

Requires Node.js >= 18.

## Usage

```bash
# Markdown rollup to stdout (default)
copilot-adoption-reporter --org my-org --token ghp_xxx

# CSV output, last 14 days
copilot-adoption-reporter --org my-org --since 2026-02-26 --until 2026-03-11 --format csv

# JSON with per-team breakdown
copilot-adoption-reporter --org my-org --teams --format json

# Write to file
copilot-adoption-reporter --org my-org --out report.md

# Pipe to other tools
copilot-adoption-reporter --org my-org --format csv | csvlook
```

## Options

| Flag | Description | Default |
| --- | --- | --- |
| `--org <org>` | GitHub organization (required) | — |
| `--token <token>` | GitHub PAT with `copilot` scope | `GITHUB_TOKEN` env |
| `--teams` | Include per-team breakdown | `false` |
| `--since <YYYY-MM-DD>` | Start date | 28 days ago |
| `--until <YYYY-MM-DD>` | End date | yesterday |
| `--format md\|csv\|json` | Output format | `md` |
| `--out <file>` | Write to file | stdout |

## Token Scopes

Your GitHub PAT needs the `manage_billing:copilot` or `copilot` scope (classic PAT), or the **"GitHub Copilot Business"** read permission (fine-grained PAT).

## Output Formats

**Markdown** (default): Headline table with period-over-period deltas, optional team breakdown, top languages and editors.

**CSV**: One row per day with columns for all key metrics. Includes a `team` column when `--teams` is used.

**JSON**: Full `CopilotWeeklyRollup` object with all computed fields.

## Delta Computation

The tool automatically fetches the prior period (same length as your date range) and computes deltas for active users, engaged users, acceptance rate, and suggestions. If the prior period exceeds the API's 28-day rolling window, deltas are omitted.

## License

MIT
