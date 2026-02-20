import type { Command } from 'commander';
import chalk from 'chalk';
import type { MinimaxClient } from '@minimax-api/core';
import { formatInboxTable } from '../formatters/table.js';
import { formatJson } from '../formatters/json.js';

export function registerInboxCommands(parent: Command, getClient: () => MinimaxClient): void {
  const inbox = parent.command('inbox').description('Inbox management');

  inbox
    .command('list')
    .description('List pending inbox items')
    .option('--page <number>', 'Page number', '1')
    .option('--page-size <number>', 'Page size', '50')
    .action(async (opts) => {
      try {
        const client = getClient();
        const orgId = client.requireOrgId(parent.opts().orgId ? Number(parent.opts().orgId) : undefined);
        const result = await client.inbox.list(orgId, {
          currentPage: Number(opts.page),
          pageSize: Number(opts.pageSize),
        });
        const format = parent.opts().format ?? 'table';
        if (format === 'json') {
          console.log(formatJson(result));
        } else {
          console.log(`\nShowing ${result.Rows.length} of ${result.TotalRows} inbox items (page ${result.CurrentPageNumber})\n`);
          console.log(formatInboxTable(result.Rows));
        }
      } catch (err) {
        console.error(chalk.red(`Failed to list inbox: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });

  inbox
    .command('get')
    .description('Get inbox item details')
    .argument('<id>', 'Inbox item ID')
    .action(async (id: string) => {
      try {
        const client = getClient();
        const orgId = client.requireOrgId(parent.opts().orgId ? Number(parent.opts().orgId) : undefined);
        const result = await client.inbox.get(orgId, Number(id));
        const format = parent.opts().format ?? 'table';
        if (format === 'json') {
          console.log(formatJson(result));
        } else {
          console.log(formatInboxTable([result]));
        }
      } catch (err) {
        console.error(chalk.red(`Failed to get inbox item: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });

  inbox
    .command('approve')
    .description('Approve an inbox item')
    .argument('<id>', 'Inbox item ID')
    .option('--reason <text>', 'Approval reason')
    .action(async (id: string, opts) => {
      try {
        const client = getClient();
        const orgId = client.requireOrgId(parent.opts().orgId ? Number(parent.opts().orgId) : undefined);
        await client.inbox.approve(orgId, Number(id), opts.reason);
        console.log(chalk.green(`Inbox item ${id} approved.`));
      } catch (err) {
        console.error(chalk.red(`Failed to approve inbox item: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });

  inbox
    .command('reject')
    .description('Reject an inbox item')
    .argument('<id>', 'Inbox item ID')
    .requiredOption('--reason <text>', 'Rejection reason (required)')
    .action(async (id: string, opts) => {
      try {
        const client = getClient();
        const orgId = client.requireOrgId(parent.opts().orgId ? Number(parent.opts().orgId) : undefined);
        await client.inbox.reject(orgId, Number(id), opts.reason);
        console.log(chalk.green(`Inbox item ${id} rejected.`));
      } catch (err) {
        console.error(chalk.red(`Failed to reject inbox item: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });

  inbox
    .command('to-invoice')
    .description('Convert inbox item to received invoice')
    .argument('<id>', 'Inbox item ID')
    .action(async (id: string) => {
      try {
        const client = getClient();
        const orgId = client.requireOrgId(parent.opts().orgId ? Number(parent.opts().orgId) : undefined);
        const result = await client.inbox.createReceivedInvoice(orgId, Number(id));
        console.log(chalk.green(`Received invoice created with ID: ${chalk.bold(String(result.ReceivedInvoiceId))}`));
        const format = parent.opts().format ?? 'table';
        if (format === 'json') {
          console.log(formatJson(result));
        }
      } catch (err) {
        console.error(chalk.red(`Failed to convert to invoice: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });
}
