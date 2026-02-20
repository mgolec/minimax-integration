import type { Command } from 'commander';
import chalk from 'chalk';
import type { MinimaxClient, ReceivedInvoice } from '@minimax-api/core';
import { formatTable } from '../formatters/table.js';
import { formatJson } from '../formatters/json.js';

const COLUMNS = [
  { key: 'ReceivedInvoiceId', label: 'ID' },
  { key: 'InvoiceNumber', label: 'Number' },
  { key: 'CustomerName', label: 'Customer' },
  { key: 'DateIssued', label: 'Date Issued' },
  { key: 'TotalAmount', label: 'Total' },
  { key: 'Status', label: 'Status' },
  { key: 'PaymentStatus', label: 'Payment' },
];

function toRow(inv: ReceivedInvoice): Record<string, unknown> {
  return {
    ...inv,
    CustomerName: inv.Customer?.Name ?? '',
    TotalAmount: inv.TotalAmount != null ? inv.TotalAmount.toFixed(2) : '',
  };
}

export function registerReceivedCommands(parent: Command, getClient: () => MinimaxClient): void {
  const received = parent.command('received').description('Received invoice management');

  received
    .command('list')
    .description('List received invoices')
    .option('--status <status>', 'Filter by status')
    .option('--from <date>', 'Date from (YYYY-MM-DD)')
    .option('--to <date>', 'Date to (YYYY-MM-DD)')
    .option('--customer-id <id>', 'Filter by customer ID')
    .option('--payment-status <status>', 'Filter by payment status')
    .option('--page <number>', 'Page number', '1')
    .option('--page-size <number>', 'Page size', '50')
    .action(async (opts) => {
      try {
        const client = getClient();
        const orgId = client.requireOrgId(parent.opts().orgId ? Number(parent.opts().orgId) : undefined);
        const result = await client.receivedInvoices.list(orgId, {
          status: opts.status,
          dateFrom: opts.from,
          dateTo: opts.to,
          customerId: opts.customerId ? Number(opts.customerId) : undefined,
          paymentStatus: opts.paymentStatus,
          currentPage: Number(opts.page),
          pageSize: Number(opts.pageSize),
        });
        const format = parent.opts().format ?? 'table';
        if (format === 'json') {
          console.log(formatJson(result));
        } else {
          console.log(`\nShowing ${result.Rows.length} of ${result.TotalRows} received invoices (page ${result.CurrentPageNumber})\n`);
          console.log(formatTable(result.Rows.map(toRow), COLUMNS));
        }
      } catch (err) {
        console.error(chalk.red(`Failed to list received invoices: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });

  received
    .command('get')
    .description('Get received invoice details')
    .argument('<id>', 'Received invoice ID')
    .action(async (id: string) => {
      try {
        const client = getClient();
        const orgId = client.requireOrgId(parent.opts().orgId ? Number(parent.opts().orgId) : undefined);
        const result = await client.receivedInvoices.get(orgId, Number(id));
        const format = parent.opts().format ?? 'table';
        if (format === 'json') {
          console.log(formatJson(result));
        } else {
          console.log(formatTable([toRow(result)], COLUMNS));
        }
      } catch (err) {
        console.error(chalk.red(`Failed to get received invoice: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });
}
