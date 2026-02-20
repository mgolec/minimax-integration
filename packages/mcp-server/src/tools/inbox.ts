import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MinimaxClient } from '@minimax-api/core';
import { formatSuccess, formatError, formatTable } from '../helpers.js';

export function registerInboxTools(server: McpServer, client: MinimaxClient) {
  server.tool(
    'list-inbox-items',
    'Lists pending documents in the inbox (documents awaiting review/approval)',
    {
      orgId: z.number().describe('Organization ID'),
    },
    async ({ orgId }) => {
      try {
        const result = await client.inbox.list(orgId);
        const header = `Inbox Items (${result.TotalRows} total)\n`;
        const table = formatTable(
          result.Rows as unknown as Record<string, unknown>[],
          [
            { key: 'InboxId', label: 'ID', width: 8 },
            { key: 'DocumentNumber', label: 'Doc Number', width: 15 },
            { key: 'Description', label: 'Description', width: 30 },
            { key: 'DateReceived', label: 'Received', width: 12 },
            { key: 'TotalAmount', label: 'Amount', width: 12 },
            { key: 'Status', label: 'Status', width: 10 },
          ],
        );
        return formatSuccess(header + table);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  server.tool(
    'get-inbox-item',
    'Gets details of an inbox item including attachments',
    {
      orgId: z.number().describe('Organization ID'),
      inboxId: z.number().describe('Inbox item ID'),
    },
    async ({ orgId, inboxId }) => {
      try {
        const item = await client.inbox.get(orgId, inboxId);
        const lines: string[] = [
          `Inbox Item #${item.InboxId}`,
          '='.repeat(50),
          `Document Number: ${item.DocumentNumber ?? 'N/A'}`,
          `Description: ${item.Description ?? 'N/A'}`,
          `Date Received: ${item.DateReceived ?? 'N/A'}`,
          `Date Document: ${item.DateDocument ?? 'N/A'}`,
          `Amount: ${item.TotalAmount ?? 'N/A'}`,
          `Status: ${item.Status ?? 'N/A'}`,
        ];

        const customer = item.Customer;
        if (customer) lines.push(`Customer: ${customer.Name ?? customer.ID}`);

        if (item.Attachments && item.Attachments.length > 0) {
          lines.push('');
          lines.push('Attachments:');
          for (const att of item.Attachments) {
            lines.push(`  - ${att.FileName ?? 'unnamed'} (${att.ContentType ?? 'unknown'}, ${att.FileSize ?? '?'} bytes)`);
          }
        }

        return formatSuccess(lines.join('\n'));
      } catch (error) {
        return formatError(error);
      }
    },
  );

  server.tool(
    'approve-inbox-item',
    'Approves an inbox document with an optional reason',
    {
      orgId: z.number().describe('Organization ID'),
      inboxId: z.number().describe('Inbox item ID'),
      reason: z.string().optional().describe('Approval reason'),
    },
    async ({ orgId, inboxId, reason }) => {
      try {
        await client.inbox.approve(orgId, inboxId, reason);
        return formatSuccess(`Inbox item ${inboxId} approved.`);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  server.tool(
    'reject-inbox-item',
    'Rejects an inbox document with a required reason',
    {
      orgId: z.number().describe('Organization ID'),
      inboxId: z.number().describe('Inbox item ID'),
      reason: z.string().describe('Rejection reason (required)'),
    },
    async ({ orgId, inboxId, reason }) => {
      try {
        await client.inbox.reject(orgId, inboxId, reason);
        return formatSuccess(`Inbox item ${inboxId} rejected.`);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  server.tool(
    'create-received-invoice-from-inbox',
    'Converts an inbox document into a received invoice',
    {
      orgId: z.number().describe('Organization ID'),
      inboxId: z.number().describe('Inbox item ID'),
    },
    async ({ orgId, inboxId }) => {
      try {
        const invoice = await client.inbox.createReceivedInvoice(orgId, inboxId);
        return formatSuccess(
          `Received invoice created from inbox item ${inboxId}.\nInvoice ID: ${invoice.ReceivedInvoiceId}\nInvoice Number: ${invoice.InvoiceNumber ?? 'N/A'}`,
        );
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
