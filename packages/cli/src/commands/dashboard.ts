import type { Command } from 'commander';
import chalk from 'chalk';
import type { MinimaxClient } from '@minimax-api/core';
import { formatDashboard } from '../formatters/table.js';
import { formatJson } from '../formatters/json.js';

export function registerDashboardCommands(parent: Command, getClient: () => MinimaxClient): void {
  parent
    .command('dashboard')
    .description('Show financial KPIs for an organisation')
    .option('--org <id>', 'Organisation ID (overrides default)')
    .action(async (opts) => {
      try {
        const client = getClient();
        const orgId = client.requireOrgId(opts.org ? Number(opts.org) : undefined);
        const data = await client.dashboard.get(orgId);
        const format = parent.opts().format ?? 'table';
        if (format === 'json') {
          console.log(formatJson(data));
        } else {
          console.log(chalk.bold('\nFinancial Dashboard\n'));
          console.log(formatDashboard(data));
        }
      } catch (err) {
        console.error(chalk.red(`Failed to load dashboard: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });
}
