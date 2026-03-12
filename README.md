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

# Per-user seat activity
copilot-adoption-reporter --org my-org --seats

# Seats as CSV (e.g. to find inactive users)
copilot-adoption-reporter --org my-org --seats --format csv

# Pipe to other tools
copilot-adoption-reporter --org my-org --format csv | csvlook
```

## Options

| Flag | Description | Default |
| --- | --- | --- |
| `--org <org>` | GitHub organization (required) | — |
| `--token <token>` | GitHub PAT with `copilot` scope | `GITHUB_TOKEN` env |
| `--teams` | Include per-team breakdown | `false` |
| `--seats` | Show per-user seat activity | `false` |
| `--since <YYYY-MM-DD>` | Start date | 28 days ago |
| `--until <YYYY-MM-DD>` | End date | yesterday |
| `--format md\|csv\|json` | Output format | `md` |
| `--out <file>` | Write to file | stdout |

## Token Scopes

Your GitHub PAT needs the `manage_billing:copilot` or `copilot` scope (classic PAT), or the **"GitHub Copilot Business"** read permission (fine-grained PAT).

For `--seats`, your token also needs access to the billing/seats endpoint (same scope covers it). For `--teams`, you additionally need `read:org` (classic) or **"Members — Read"** (fine-grained).

## Output Formats

**Markdown** (default): Headline table with period-over-period deltas, optional team breakdown, top languages and editors.

**CSV**: One row per day with columns for all key metrics. Includes a `team` column when `--teams` is used.

**JSON**: Full `CopilotWeeklyRollup` object with all computed fields.

### Seats (`--seats`)

When `--seats` is used, the report includes per-user activity data from the Copilot billing/seats API:

- **Markdown**: Adds a "Seats" table showing each user's last activity date, days since last use, editor, and active/inactive status.
- **CSV**: Outputs one row per user with login, last activity timestamp, editor, and status.
- **JSON**: Array of seat objects with all fields.

Users are marked **Inactive** if they haven't used Copilot in over 14 days or have never used it.

## Delta Computation

The tool automatically fetches the prior period (same length as your date range) and computes deltas for active users, engaged users, acceptance rate, and suggestions. If the prior period exceeds the API's 28-day rolling window, deltas are omitted.

## License

MIT
