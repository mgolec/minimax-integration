import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MinimaxClient } from '@minimax-api/core';
import { formatSuccess, formatError, formatTable } from '../helpers.js';

export function registerOrganisationTools(server: McpServer, client: MinimaxClient) {
  server.tool(
    'list-organizations',
    'Lists all accessible Minimax organizations for the current user',
    async () => {
      try {
        const result = await client.organisations.list();
        const rows = result.Rows.map((r) => ({
          ID: r.Organisation.ID,
          Name: r.Organisation.Name,
          APIAccess: r.APIAccess,
        }));
        const text = formatTable(
          rows as unknown as Record<string, unknown>[],
          [
            { key: 'ID', label: 'ID', width: 8 },
            { key: 'Name', label: 'Name', width: 40 },
            { key: 'APIAccess', label: 'API Access', width: 12 },
          ],
        );
        return formatSuccess(text);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  server.tool(
    'get-organization',
    'Gets detailed information about a specific Minimax organization',
    { orgId: z.number().describe('Organization ID') },
    async ({ orgId }) => {
      try {
        const org = await client.organisations.get(orgId);
        return formatSuccess(org);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  server.tool(
    'get-dashboard',
    'Gets financial overview / KPIs for an organization: issued/received invoice summaries (paid, unpaid, overdue), unpaid aging (15/30/45/60 days), top customers/debtors/suppliers/creditors, monthly revenue vs expenses',
    { orgId: z.number().describe('Organization ID') },
    async ({ orgId }) => {
      try {
        const dashboard = await client.dashboard.get(orgId) as Record<string, unknown>;
        const d = dashboard as {
          IssuedInvoicesSummary?: { Data?: { Type: string; Count: number; Value: number }[] };
          ReceivedInvoicesSummary?: { Data?: { Type: string; Count: number; Value: number }[] };
          IssuedInvoicesUnpaid?: { Data?: { Type: string; Count: number; Value: number }[] };
          ReceivedInvoicesUnpaid?: { Data?: { Type: string; Count: number; Value: number }[] };
          TopCustomers?: { Data?: { Position: number; Customer: string; Value: number }[] };
          TopSuppliers?: { Data?: { Position: number; Customer: string; Value: number }[] };
          TopDebtors?: { Data?: { Position: number; Customer: string; Value: number }[] };
          TopCreditors?: { Data?: { Position: number; Customer: string; Value: number }[] };
          RevenuesExpenses?: { Data?: { Month: number; Revenue: number; Expense: number }[] };
        };

        const lines: string[] = ['Financial Dashboard', '='.repeat(60)];

        const formatSummary = (label: string, data?: { Type: string; Count: number; Value: number }[]) => {
          if (!data) return;
          lines.push(`\n${label}:`);
          for (const item of data) {
            lines.push(`  ${item.Type.padEnd(20)} ${String(item.Count).padStart(4)} invoices  ${item.Value.toFixed(2).padStart(12)} EUR`);
          }
        };

        formatSummary('Issued Invoices', d.IssuedInvoicesSummary?.Data);
        formatSummary('Received Invoices', d.ReceivedInvoicesSummary?.Data);
        formatSummary('Unpaid Issued (aging)', d.IssuedInvoicesUnpaid?.Data);
        formatSummary('Unpaid Received (aging)', d.ReceivedInvoicesUnpaid?.Data);

        const formatTop = (label: string, data?: { Position: number; Customer: string; Value: number }[]) => {
          if (!data) return;
          const nonEmpty = data.filter((x) => x.Customer);
          if (nonEmpty.length === 0) return;
          lines.push(`\n${label}:`);
          for (const item of nonEmpty) {
            lines.push(`  ${String(item.Position).padEnd(3)} ${item.Customer.padEnd(45)} ${item.Value.toFixed(2).padStart(12)} EUR`);
          }
        };

        formatTop('Top Customers', d.TopCustomers?.Data);
        formatTop('Top Suppliers', d.TopSuppliers?.Data);
        formatTop('Top Debtors', d.TopDebtors?.Data);
        formatTop('Top Creditors', d.TopCreditors?.Data);

        if (d.RevenuesExpenses?.Data) {
          const nonZero = d.RevenuesExpenses.Data.filter((m) => m.Revenue > 0 || m.Expense > 0);
          if (nonZero.length > 0) {
            lines.push('\nMonthly Revenue vs Expenses:');
            for (const m of nonZero) {
              lines.push(`  Month ${String(m.Month).padStart(2)}: Revenue ${m.Revenue.toFixed(2).padStart(12)}  Expense ${m.Expense.toFixed(2).padStart(12)}`);
            }
          }
        }

        return formatSuccess(lines.join('\n'));
      } catch (error) {
        return formatError(error);
      }
    },
  );

  server.tool(
    'get-rate-limit-status',
    'Returns the current API usage budget (daily/monthly calls used vs limits)',
    async () => {
      try {
        const status = client.getRateLimitStatus();
        const lines = [
          'API Rate Limit Status',
          '='.repeat(40),
          `Daily:   ${status.dailyUsed} / ${status.dailyLimit} (resets ${status.dailyResetAt.toISOString()})`,
          `Monthly: ${status.monthlyUsed} / ${status.monthlyLimit} (resets ${status.monthlyResetAt.toISOString()})`,
        ];
        return formatSuccess(lines.join('\n'));
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
