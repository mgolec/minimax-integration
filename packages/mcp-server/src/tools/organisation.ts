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
    'Gets financial overview / KPIs for an organization (revenue, expenses, profit, receivables, payables)',
    { orgId: z.number().describe('Organization ID') },
    async ({ orgId }) => {
      try {
        const dashboard = await client.dashboard.get(orgId);
        const lines: string[] = [
          'Financial Dashboard',
          '='.repeat(40),
          `Revenue:              ${dashboard.Revenue ?? 'N/A'}`,
          `Expenses:             ${dashboard.Expenses ?? 'N/A'}`,
          `Profit:               ${dashboard.Profit ?? 'N/A'}`,
          `Cash Balance:         ${dashboard.CashBalance ?? 'N/A'}`,
          '',
          `Accounts Receivable:  ${dashboard.AccountsReceivable ?? 'N/A'}`,
          `Accounts Payable:     ${dashboard.AccountsPayable ?? 'N/A'}`,
          `Overdue Receivables:  ${dashboard.OverdueReceivables ?? 'N/A'}`,
          `Overdue Payables:     ${dashboard.OverduePayables ?? 'N/A'}`,
          '',
          `Unpaid Issued:        ${dashboard.UnpaidIssuedInvoices ?? 'N/A'}`,
          `Unpaid Received:      ${dashboard.UnpaidReceivedInvoices ?? 'N/A'}`,
        ];
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
