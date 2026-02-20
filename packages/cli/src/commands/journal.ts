import type { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'node:fs';
import type { MinimaxClient } from '@minimax-api/core';
import { parseBankStatement } from '@minimax-api/core';
import type { BankStatementFormat } from '@minimax-api/core';
import { formatJournalsTable, formatTable } from '../formatters/table.js';
import { formatJson } from '../formatters/json.js';

export function registerJournalCommands(parent: Command, getClient: () => MinimaxClient): void {
  const journal = parent.command('journal').description('Journal management');

  journal
    .command('list')
    .description('List journals')
    .option('--page <number>', 'Page number', '1')
    .option('--page-size <number>', 'Page size', '50')
    .action(async (opts) => {
      try {
        const client = getClient();
        const orgId = client.requireOrgId(parent.opts().orgId ? Number(parent.opts().orgId) : undefined);
        const result = await client.journals.list(orgId, {
          currentPage: Number(opts.page),
          pageSize: Number(opts.pageSize),
        });
        const format = parent.opts().format ?? 'table';
        if (format === 'json') {
          console.log(formatJson(result));
        } else {
          console.log(`\nShowing ${result.Rows.length} of ${result.TotalRows} journals (page ${result.CurrentPageNumber})\n`);
          console.log(formatJournalsTable(result.Rows));
        }
      } catch (err) {
        console.error(chalk.red(`Failed to list journals: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });

  journal
    .command('get')
    .description('Get journal details')
    .argument('<id>', 'Journal ID')
    .action(async (id: string) => {
      try {
        const client = getClient();
        const orgId = client.requireOrgId(parent.opts().orgId ? Number(parent.opts().orgId) : undefined);
        const result = await client.journals.get(orgId, Number(id));
        const format = parent.opts().format ?? 'table';
        if (format === 'json') {
          console.log(formatJson(result));
        } else {
          console.log(formatJournalsTable([result]));
          if (result.JournalEntries?.length) {
            console.log(chalk.bold('\nEntries:\n'));
            console.log(
              formatTable(
                result.JournalEntries.map((e) => ({
                  ...e,
                  AccountName: e.Account?.Name ?? '',
                  CustomerName: e.Customer?.Name ?? '',
                  Debit: e.Debit != null ? e.Debit.toFixed(2) : '',
                  Credit: e.Credit != null ? e.Credit.toFixed(2) : '',
                })),
                [
                  { key: 'AccountName', label: 'Account' },
                  { key: 'CustomerName', label: 'Customer' },
                  { key: 'Description', label: 'Description' },
                  { key: 'Debit', label: 'Debit' },
                  { key: 'Credit', label: 'Credit' },
                ],
              ),
            );
          }
        }
      } catch (err) {
        console.error(chalk.red(`Failed to get journal: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });

  journal
    .command('create')
    .description('Create a journal entry')
    .requiredOption('--date <date>', 'Document date (YYYY-MM-DD)')
    .option('--description <text>', 'Description')
    .option('--type <type>', 'Journal type (T=General, B=BankStatement)', 'T')
    .requiredOption('--account-id <id>', 'Account ID for entry')
    .requiredOption('--debit <amount>', 'Debit amount')
    .requiredOption('--credit <amount>', 'Credit amount')
    .action(async (opts) => {
      try {
        const client = getClient();
        const orgId = client.requireOrgId(parent.opts().orgId ? Number(parent.opts().orgId) : undefined);
        const result = await client.journals.create(orgId, {
          DateDocument: opts.date,
          Description: opts.description,
          JournalType: opts.type,
          JournalEntries: [
            {
              Account: { ID: Number(opts.accountId) },
              Debit: Number(opts.debit),
              Credit: Number(opts.credit),
            },
          ],
        });
        console.log(chalk.green(`Journal created with ID: ${chalk.bold(String(result.JournalId))}`));
        const format = parent.opts().format ?? 'table';
        if (format === 'json') {
          console.log(formatJson(result));
        }
      } catch (err) {
        console.error(chalk.red(`Failed to create journal: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });

  journal
    .command('entries')
    .description('List all journal entries')
    .option('--page <number>', 'Page number', '1')
    .option('--page-size <number>', 'Page size', '100')
    .action(async (opts) => {
      try {
        const client = getClient();
        const orgId = client.requireOrgId(parent.opts().orgId ? Number(parent.opts().orgId) : undefined);
        const result = await client.journals.listEntries(orgId, {
          currentPage: Number(opts.page),
          pageSize: Number(opts.pageSize),
        });
        const format = parent.opts().format ?? 'table';
        if (format === 'json') {
          console.log(formatJson(result));
        } else {
          console.log(`\nShowing ${result.Rows.length} of ${result.TotalRows} entries (page ${result.CurrentPageNumber})\n`);
          console.log(
            formatTable(
              result.Rows.map((e) => ({
                ...e,
                AccountName: e.Account?.Name ?? '',
                CustomerName: e.Customer?.Name ?? '',
                Debit: e.Debit != null ? e.Debit.toFixed(2) : '',
                Credit: e.Credit != null ? e.Credit.toFixed(2) : '',
              })),
              [
                { key: 'AccountName', label: 'Account' },
                { key: 'CustomerName', label: 'Customer' },
                { key: 'Description', label: 'Description' },
                { key: 'Debit', label: 'Debit' },
                { key: 'Credit', label: 'Credit' },
              ],
            ),
          );
        }
      } catch (err) {
        console.error(chalk.red(`Failed to list entries: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });

  journal
    .command('import')
    .description('Import bank statement file')
    .argument('<file>', 'Bank statement file path')
    .option('--format <format>', 'File format (csv, mt940, xml)')
    .action(async (file: string, opts) => {
      try {
        const content = readFileSync(file, 'utf-8');
        const format = opts.format as BankStatementFormat | undefined;
        const result = parseBankStatement(content, { format, filename: file });
        console.log(chalk.green(`Parsed ${result.transactions.length} transactions from ${file}`));
        if (result.accountIBAN) console.log(`Account IBAN: ${result.accountIBAN}`);
        if (result.statementDate) console.log(`Statement date: ${result.statementDate}`);
        if (result.openingBalance != null) console.log(`Opening balance: ${result.openingBalance.toFixed(2)}`);
        if (result.closingBalance != null) console.log(`Closing balance: ${result.closingBalance.toFixed(2)}`);

        const outputFormat = parent.opts().format ?? 'table';
        if (outputFormat === 'json') {
          console.log(formatJson(result));
        } else {
          console.log(
            formatTable(
              result.transactions.map((t) => ({
                ...t,
                amount: t.amount.toFixed(2),
              })),
              [
                { key: 'date', label: 'Date' },
                { key: 'description', label: 'Description' },
                { key: 'amount', label: 'Amount' },
                { key: 'counterpartyName', label: 'Counterparty' },
                { key: 'reference', label: 'Reference' },
              ],
            ),
          );
        }
      } catch (err) {
        console.error(chalk.red(`Failed to import file: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });
}
