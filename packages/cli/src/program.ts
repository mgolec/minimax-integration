import { Command } from 'commander';
import chalk from 'chalk';
import { MinimaxClient } from '@minimax-api/core';
import { registerAuthCommands } from './commands/auth.js';
import { registerOrgCommands } from './commands/org.js';
import { registerDashboardCommands } from './commands/dashboard.js';
import { registerInvoiceCommands } from './commands/invoice.js';
import { registerReceivedCommands } from './commands/received.js';
import { registerInboxCommands } from './commands/inbox.js';
import { registerJournalCommands } from './commands/journal.js';
import { registerCustomerCommands } from './commands/customer.js';
import { formatJson } from './formatters/json.js';

export const program = new Command();

program
  .name('minimax')
  .description('CLI tool for Minimax Accounting API')
  .version('1.0.0')
  .option('--org-id <id>', 'Organisation ID')
  .option('--format <format>', 'Output format (table, json)', 'table')
  .option('--verbose', 'Enable verbose output');

let clientInstance: MinimaxClient | undefined;

function getClient(): MinimaxClient {
  if (!clientInstance) {
    const orgIdOpt = program.opts().orgId;
    clientInstance = new MinimaxClient({
      orgId: orgIdOpt ? Number(orgIdOpt) : undefined,
    });
  }
  return clientInstance;
}

// Register all command groups
registerAuthCommands(program, getClient);
registerOrgCommands(program, getClient);
registerDashboardCommands(program, getClient);
registerInvoiceCommands(program, getClient);
registerReceivedCommands(program, getClient);
registerInboxCommands(program, getClient);
registerJournalCommands(program, getClient);
registerCustomerCommands(program, getClient);

// Rate limits command
program
  .command('rate-limits')
  .description('Show current rate limit status')
  .action(() => {
    try {
      const client = getClient();
      const status = client.getRateLimitStatus();
      const format = program.opts().format ?? 'table';
      if (format === 'json') {
        console.log(formatJson(status));
      } else {
        console.log(chalk.bold('\nRate Limit Status\n'));
        console.log(`  Daily:   ${status.dailyUsed} / ${status.dailyLimit}  (resets ${status.dailyResetAt.toLocaleString()})`);
        console.log(`  Monthly: ${status.monthlyUsed} / ${status.monthlyLimit}  (resets ${status.monthlyResetAt.toLocaleString()})`);
        console.log();
      }
    } catch (err) {
      console.error(chalk.red(`Failed to get rate limits: ${err instanceof Error ? err.message : String(err)}`));
      process.exitCode = 1;
    }
  });
