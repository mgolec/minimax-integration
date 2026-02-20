import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MinimaxClient } from '@minimax-api/core';
import { formatSuccess, formatError, formatTable, formatInvoice } from '../helpers.js';

export function registerReceivedInvoiceTools(server: McpServer, client: MinimaxClient) {
  server.tool(
    'list-received-invoices',
    'Lists received (incoming) invoices with optional filters. Returns a paginated table.',
    {
      orgId: z.number().describe('Organization ID'),
      status: z.string().optional().describe('Status filter: O=Draft, P=Confirmed, Z=Rejected'),
      dateFrom: z.string().optional().describe('Start date filter (YYYY-MM-DD)'),
      dateTo: z.string().optional().describe('End date filter (YYYY-MM-DD)'),
      paymentStatus: z.string().optional().describe('Payment status filter'),
      pageSize: z.number().optional().describe('Results per page (default 50)'),
      currentPage: z.number().optional().describe('Page number (default 1)'),
    },
    async ({ orgId, status, dateFrom, dateTo, paymentStatus, pageSize, currentPage }) => {
      try {
        const result = await client.receivedInvoices.list(orgId, {
          status,
          dateFrom,
          dateTo,
          paymentStatus,
          pageSize,
          currentPage,
        });
        const header = `Received Invoices (${result.TotalRows} total, page ${result.CurrentPageNumber})\n`;
        const table = formatTable(
          result.Rows as unknown as Record<string, unknown>[],
          [
            { key: 'ReceivedInvoiceId', label: 'ID', width: 8 },
            { key: 'InvoiceNumber', label: 'Number', width: 15 },
            { key: 'DateReceived', label: 'Received', width: 12 },
            { key: 'Status', label: 'Status', width: 8 },
            { key: 'TotalAmount', label: 'Amount', width: 12 },
            { key: 'PaymentStatus', label: 'Payment', width: 20 },
          ],
        );
        return formatSuccess(header + table);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  server.tool(
    'get-received-invoice',
    'Gets full details of a received invoice including line items, amounts, and RowVersion',
    {
      orgId: z.number().describe('Organization ID'),
      invoiceId: z.number().describe('Received invoice ID'),
    },
    async ({ orgId, invoiceId }) => {
      try {
        const invoice = await client.receivedInvoices.get(orgId, invoiceId);
        return formatSuccess(formatInvoice(invoice as unknown as Record<string, unknown>));
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
