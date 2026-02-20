import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MinimaxClient } from '@minimax-api/core';
import { parseBankStatement, type ColumnMapping } from '@minimax-api/core';
import { formatSuccess, formatError, formatTable } from '../helpers.js';

export function registerJournalTools(server: McpServer, client: MinimaxClient) {
  server.tool(
    'list-journals',
    'Lists journal entries for an organization. Returns a paginated table.',
    {
      orgId: z.number().describe('Organization ID'),
      pageSize: z.number().optional().describe('Results per page (default 50)'),
      currentPage: z.number().optional().describe('Page number (default 1)'),
    },
    async ({ orgId, pageSize, currentPage }) => {
      try {
        const result = await client.journals.list(orgId, { pageSize, currentPage });
        const header = `Journals (${result.TotalRows} total, page ${result.CurrentPageNumber})\n`;
        const table = formatTable(
          result.Rows as unknown as Record<string, unknown>[],
          [
            { key: 'JournalId', label: 'ID', width: 8 },
            { key: 'DocumentNumber', label: 'Doc Number', width: 15 },
            { key: 'DateDocument', label: 'Date', width: 12 },
            { key: 'Description', label: 'Description', width: 30 },
            { key: 'TotalDebit', label: 'Debit', width: 12 },
            { key: 'TotalCredit', label: 'Credit', width: 12 },
          ],
        );
        return formatSuccess(header + table);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  server.tool(
    'get-journal',
    'Gets full journal details including debit/credit postings',
    {
      orgId: z.number().describe('Organization ID'),
      journalId: z.number().describe('Journal ID'),
    },
    async ({ orgId, journalId }) => {
      try {
        const journal = await client.journals.get(orgId, journalId);
        const lines: string[] = [
          `Journal #${journal.DocumentNumber ?? journal.JournalId}`,
          '='.repeat(50),
          `Date: ${journal.DateDocument ?? 'N/A'}`,
          `Description: ${journal.Description ?? 'N/A'}`,
          `Type: ${journal.JournalType ?? 'N/A'}`,
          `Status: ${journal.Status ?? 'N/A'}`,
          `Total Debit: ${journal.TotalDebit ?? 0}`,
          `Total Credit: ${journal.TotalCredit ?? 0}`,
        ];

        if (journal.JournalEntries && journal.JournalEntries.length > 0) {
          lines.push('');
          lines.push('Entries:');
          lines.push('-'.repeat(50));
          for (const entry of journal.JournalEntries) {
            const account = entry.Account?.Name ?? String(entry.Account?.ID ?? 'N/A');
            const desc = entry.Description ?? '';
            const debit = entry.Debit ?? 0;
            const credit = entry.Credit ?? 0;
            lines.push(`  ${account} | ${desc} | Debit: ${debit} | Credit: ${credit}`);
          }
        }

        if (journal.RowVersion) {
          lines.push('');
          lines.push(`RowVersion: ${journal.RowVersion}`);
        }

        return formatSuccess(lines.join('\n'));
      } catch (error) {
        return formatError(error);
      }
    },
  );

  server.tool(
    'create-journal',
    'Creates a new journal entry with debit/credit postings. Entries must balance (total debit = total credit).',
    {
      orgId: z.number().describe('Organization ID'),
      dateDocument: z.string().describe('Document date (YYYY-MM-DD)'),
      description: z.string().optional().describe('Journal description'),
      entries: z.array(z.object({
        Account: z.object({ ID: z.number() }).describe('Account reference'),
        Description: z.string().optional().describe('Entry description'),
        Debit: z.number().optional().describe('Debit amount'),
        Credit: z.number().optional().describe('Credit amount'),
        Customer: z.object({ ID: z.number() }).optional().describe('Customer reference'),
      })).describe('Journal line entries (must balance)'),
      documentNumbering: z.object({ ID: z.number() }).optional().describe('Document numbering reference'),
    },
    async ({ orgId, dateDocument, description, entries, documentNumbering }) => {
      try {
        const journal = await client.journals.create(orgId, {
          DateDocument: dateDocument,
          Description: description,
          JournalEntries: entries,
          DocumentNumbering: documentNumbering,
        });
        return formatSuccess(
          `Journal created successfully.\nID: ${journal.JournalId}\nDocument: ${journal.DocumentNumber ?? 'N/A'}`,
        );
      } catch (error) {
        return formatError(error);
      }
    },
  );

  server.tool(
    'upload-bank-statement',
    'Parses a bank statement (CSV, MT940, or CAMT.053 XML) and creates journal entries for each transaction. Provide the raw file content as text.',
    {
      orgId: z.number().describe('Organization ID'),
      fileContent: z.string().describe('Raw bank statement file content (text)'),
      format: z.enum(['csv', 'mt940', 'xml']).optional().describe('File format (auto-detected if omitted)'),
      csvMapping: z.object({
        date: z.union([z.number(), z.string()]).describe('Date column index or header name'),
        amount: z.union([z.number(), z.string()]).describe('Amount column index or header name'),
        description: z.union([z.number(), z.string()]).describe('Description column index or header name'),
        counterpartyName: z.union([z.number(), z.string()]).optional(),
        counterpartyIBAN: z.union([z.number(), z.string()]).optional(),
        reference: z.union([z.number(), z.string()]).optional(),
      }).optional().describe('Column mapping for CSV files'),
    },
    async ({ orgId, fileContent, format, csvMapping }) => {
      try {
        const result = parseBankStatement(fileContent, {
          format,
          csvMapping: csvMapping as ColumnMapping | undefined,
        });

        if (result.transactions.length === 0) {
          return formatSuccess('No transactions found in the bank statement.');
        }

        const entries = result.transactions.map((tx) => ({
          Account: { ID: 1000 },
          Description: `${tx.description}${tx.counterpartyName ? ` - ${tx.counterpartyName}` : ''}`,
          Debit: tx.amount > 0 ? tx.amount : 0,
          Credit: tx.amount < 0 ? Math.abs(tx.amount) : 0,
        }));

        const journal = await client.journals.create(orgId, {
          DateDocument: result.statementDate ?? new Date().toISOString().split('T')[0],
          Description: `Bank statement import (${result.transactions.length} transactions)`,
          JournalType: 'B',
          JournalEntries: entries,
        });

        const lines = [
          `Bank statement parsed: ${result.transactions.length} transactions`,
          `Account IBAN: ${result.accountIBAN ?? 'N/A'}`,
          `Statement Date: ${result.statementDate ?? 'N/A'}`,
          `Opening Balance: ${result.openingBalance ?? 'N/A'}`,
          `Closing Balance: ${result.closingBalance ?? 'N/A'}`,
          '',
          `Journal created: ID ${journal.JournalId}, Document ${journal.DocumentNumber ?? 'N/A'}`,
        ];

        return formatSuccess(lines.join('\n'));
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
