import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MinimaxClient } from '@minimax-api/core';
import { formatSuccess, formatError, formatTable, formatInvoice } from '../helpers.js';

export function registerIssuedInvoiceTools(server: McpServer, client: MinimaxClient) {
  server.tool(
    'list-issued-invoices',
    'Lists issued invoices with optional filters (status, dates, customer, payment status). Returns a paginated table.',
    {
      orgId: z.number().describe('Organization ID'),
      status: z.string().optional().describe('Invoice status filter: O=Draft, I=Issued'),
      dateFrom: z.string().optional().describe('Start date filter (YYYY-MM-DD)'),
      dateTo: z.string().optional().describe('End date filter (YYYY-MM-DD)'),
      customerId: z.number().optional().describe('Filter by customer ID'),
      paymentStatus: z.string().optional().describe('Payment status filter'),
      pageSize: z.number().optional().describe('Results per page (default 50)'),
      currentPage: z.number().optional().describe('Page number (default 1)'),
    },
    async ({ orgId, status, dateFrom, dateTo, customerId, paymentStatus, pageSize, currentPage }) => {
      try {
        const result = await client.issuedInvoices.list(orgId, {
          status,
          dateFrom,
          dateTo,
          customerId,
          paymentStatus,
          pageSize,
          currentPage,
        });
        const header = `Issued Invoices (${result.TotalRows} total, page ${result.CurrentPageNumber})\n`;
        const table = formatTable(
          result.Rows as unknown as Record<string, unknown>[],
          [
            { key: 'IssuedInvoiceId', label: 'ID', width: 8 },
            { key: 'InvoiceNumber', label: 'Number', width: 15 },
            { key: 'DateIssued', label: 'Date', width: 12 },
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
    'get-issued-invoice',
    'Gets full details of an issued invoice including line items, amounts, and RowVersion',
    {
      orgId: z.number().describe('Organization ID'),
      invoiceId: z.number().describe('Issued invoice ID'),
    },
    async ({ orgId, invoiceId }) => {
      try {
        const invoice = await client.issuedInvoices.get(orgId, invoiceId);
        return formatSuccess(formatInvoice(invoice as unknown as Record<string, unknown>));
      } catch (error) {
        return formatError(error);
      }
    },
  );

  server.tool(
    'create-issued-invoice',
    'Creates a new draft issued invoice. Returns the created invoice with its ID and RowVersion.',
    {
      orgId: z.number().describe('Organization ID'),
      customer: z.object({
        ID: z.number().describe('Customer ID'),
        Name: z.string().optional().describe('Customer name'),
      }).describe('Customer reference'),
      dateIssued: z.string().describe('Issue date (YYYY-MM-DD)'),
      dateDue: z.string().describe('Due date (YYYY-MM-DD)'),
      rows: z.array(z.object({
        Description: z.string().optional().describe('Line item description'),
        Quantity: z.number().optional().describe('Quantity'),
        Price: z.number().optional().describe('Unit price'),
        Discount: z.number().optional().describe('Discount percentage'),
        VATRate: z.object({ ID: z.number() }).optional().describe('VAT rate reference'),
        Item: z.object({ ID: z.number() }).optional().describe('Item/product reference'),
      })).describe('Invoice line items'),
      documentNumbering: z.object({ ID: z.number() }).optional().describe('Document numbering reference'),
      currency: z.object({ ID: z.number() }).optional().describe('Currency reference'),
    },
    async ({ orgId, customer, dateIssued, dateDue, rows, documentNumbering, currency }) => {
      try {
        const invoice = await client.issuedInvoices.create(orgId, {
          Customer: customer,
          DateIssued: dateIssued,
          DateDue: dateDue,
          IssuedInvoiceRows: rows,
          DocumentNumbering: documentNumbering,
          Currency: currency,
        });
        return formatSuccess(
          `Invoice created successfully.\n\n${formatInvoice(invoice as unknown as Record<string, unknown>)}`,
        );
      } catch (error) {
        return formatError(error);
      }
    },
  );

  server.tool(
    'issue-invoice',
    'Finalizes a draft issued invoice, changing its status from Draft to Issued. Requires the current RowVersion.',
    {
      orgId: z.number().describe('Organization ID'),
      invoiceId: z.number().describe('Issued invoice ID'),
      rowVersion: z.string().describe('Current RowVersion of the invoice (for concurrency control)'),
    },
    async ({ orgId, invoiceId, rowVersion }) => {
      try {
        const invoice = await client.issuedInvoices.issue(orgId, invoiceId, rowVersion);
        return formatSuccess(
          `Invoice issued successfully.\n\n${formatInvoice(invoice as unknown as Record<string, unknown>)}`,
        );
      } catch (error) {
        return formatError(error);
      }
    },
  );

  server.tool(
    'issue-and-generate-pdf',
    'Issues a draft invoice and generates its PDF in one step. Requires the current RowVersion.',
    {
      orgId: z.number().describe('Organization ID'),
      invoiceId: z.number().describe('Issued invoice ID'),
      rowVersion: z.string().describe('Current RowVersion of the invoice (for concurrency control)'),
    },
    async ({ orgId, invoiceId, rowVersion }) => {
      try {
        const invoice = await client.issuedInvoices.issueAndGeneratePdf(orgId, invoiceId, rowVersion);
        return formatSuccess(
          `Invoice issued and PDF generated.\n\n${formatInvoice(invoice as unknown as Record<string, unknown>)}`,
        );
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
