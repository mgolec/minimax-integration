import type { Command } from 'commander';
import chalk from 'chalk';
import type { MinimaxClient } from '@minimax-api/core';
import { formatInvoicesTable } from '../formatters/table.js';
import { formatJson } from '../formatters/json.js';

export function registerInvoiceCommands(parent: Command, getClient: () => MinimaxClient): void {
  const invoice = parent.command('invoice').description('Issued invoice management');

  invoice
    .command('list')
    .description('List issued invoices')
    .option('--status <status>', 'Filter by status (O=Draft, I=Issued)')
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
        const result = await client.issuedInvoices.list(orgId, {
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
          console.log(`\nShowing ${result.Rows.length} of ${result.TotalRows} invoices (page ${result.CurrentPageNumber})\n`);
          console.log(formatInvoicesTable(result.Rows));
        }
      } catch (err) {
        console.error(chalk.red(`Failed to list invoices: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });

  invoice
    .command('get')
    .description('Get invoice details')
    .argument('<id>', 'Invoice ID')
    .action(async (id: string) => {
      try {
        const client = getClient();
        const orgId = client.requireOrgId(parent.opts().orgId ? Number(parent.opts().orgId) : undefined);
        const result = await client.issuedInvoices.get(orgId, Number(id));
        const format = parent.opts().format ?? 'table';
        if (format === 'json') {
          console.log(formatJson(result));
        } else {
          console.log(formatInvoicesTable([result]));
        }
      } catch (err) {
        console.error(chalk.red(`Failed to get invoice: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });

  invoice
    .command('create')
    .description('Create a draft invoice')
    .requiredOption('--customer-id <id>', 'Customer ID')
    .requiredOption('--date-issued <date>', 'Date issued (YYYY-MM-DD)')
    .requiredOption('--date-due <date>', 'Date due (YYYY-MM-DD)')
    .option('--item-id <id>', 'Item ID for a single row')
    .option('--description <text>', 'Row description')
    .option('--quantity <n>', 'Quantity', '1')
    .option('--price <n>', 'Unit price')
    .action(async (opts) => {
      try {
        const client = getClient();
        const orgId = client.requireOrgId(parent.opts().orgId ? Number(parent.opts().orgId) : undefined);
        const rows = [];
        if (opts.itemId || opts.description) {
          rows.push({
            Item: opts.itemId ? { ID: Number(opts.itemId) } : undefined,
            Description: opts.description,
            Quantity: Number(opts.quantity),
            Price: opts.price ? Number(opts.price) : undefined,
          });
        }
        const result = await client.issuedInvoices.create(orgId, {
          Customer: { ID: Number(opts.customerId) },
          DateIssued: opts.dateIssued,
          DateDue: opts.dateDue,
          IssuedInvoiceRows: rows,
        });
        console.log(chalk.green(`Invoice created with ID: ${chalk.bold(String(result.IssuedInvoiceId))}`));
        const format = parent.opts().format ?? 'table';
        if (format === 'json') {
          console.log(formatJson(result));
        }
      } catch (err) {
        console.error(chalk.red(`Failed to create invoice: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });

  invoice
    .command('issue')
    .description('Issue/finalize a draft invoice')
    .argument('<id>', 'Invoice ID')
    .action(async (id: string) => {
      try {
        const client = getClient();
        const orgId = client.requireOrgId(parent.opts().orgId ? Number(parent.opts().orgId) : undefined);
        const inv = await client.issuedInvoices.get(orgId, Number(id));
        if (!inv.RowVersion) throw new Error('Invoice has no RowVersion; cannot issue.');
        const result = await client.issuedInvoices.issue(orgId, Number(id), inv.RowVersion);
        console.log(chalk.green(`Invoice ${id} issued successfully.`));
        const format = parent.opts().format ?? 'table';
        if (format === 'json') {
          console.log(formatJson(result));
        }
      } catch (err) {
        console.error(chalk.red(`Failed to issue invoice: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });

  invoice
    .command('pdf')
    .description('Generate PDF for an invoice')
    .argument('<id>', 'Invoice ID')
    .action(async (id: string) => {
      try {
        const client = getClient();
        const orgId = client.requireOrgId(parent.opts().orgId ? Number(parent.opts().orgId) : undefined);
        const inv = await client.issuedInvoices.get(orgId, Number(id));
        if (!inv.RowVersion) throw new Error('Invoice has no RowVersion; cannot generate PDF.');
        const result = await client.issuedInvoices.generatePdf(orgId, Number(id), inv.RowVersion);
        console.log(chalk.green(`PDF generated for invoice ${id}.`));
        const format = parent.opts().format ?? 'table';
        if (format === 'json') {
          console.log(formatJson(result));
        }
      } catch (err) {
        console.error(chalk.red(`Failed to generate PDF: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });

  invoice
    .command('issue-pdf')
    .description('Issue invoice and generate PDF in one step')
    .argument('<id>', 'Invoice ID')
    .action(async (id: string) => {
      try {
        const client = getClient();
        const orgId = client.requireOrgId(parent.opts().orgId ? Number(parent.opts().orgId) : undefined);
        const inv = await client.issuedInvoices.get(orgId, Number(id));
        if (!inv.RowVersion) throw new Error('Invoice has no RowVersion; cannot issue.');
        const result = await client.issuedInvoices.issueAndGeneratePdf(orgId, Number(id), inv.RowVersion);
        console.log(chalk.green(`Invoice ${id} issued and PDF generated.`));
        const format = parent.opts().format ?? 'table';
        if (format === 'json') {
          console.log(formatJson(result));
        }
      } catch (err) {
        console.error(chalk.red(`Failed to issue/generate PDF: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });
}
