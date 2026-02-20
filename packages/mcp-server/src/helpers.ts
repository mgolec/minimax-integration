import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { MinimaxError } from '@minimax-api/core';

export function formatSuccess(data: unknown): CallToolResult {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  return { content: [{ type: 'text', text }] };
}

export function formatError(error: unknown): CallToolResult {
  let message: string;
  if (error instanceof Error) {
    const me = error as MinimaxError;
    message = me.statusCode
      ? `Error ${me.statusCode}: ${me.message}`
      : error.message;
  } else {
    message = String(error);
  }
  return { content: [{ type: 'text', text: message }], isError: true };
}

export function formatTable(
  rows: Record<string, unknown>[],
  columns: { key: string; label: string; width?: number }[],
): string {
  if (rows.length === 0) return 'No results found.';

  const widths = columns.map((col) => {
    const values = rows.map((r) => String(r[col.key] ?? ''));
    return col.width ?? Math.max(col.label.length, ...values.map((v) => v.length));
  });

  const header = columns.map((col, i) => col.label.padEnd(widths[i])).join(' | ');
  const separator = widths.map((w) => '-'.repeat(w)).join('-+-');
  const body = rows.map((row) =>
    columns.map((col, i) => String(row[col.key] ?? '').padEnd(widths[i])).join(' | '),
  );

  return [header, separator, ...body].join('\n');
}

export function formatInvoice(invoice: Record<string, unknown>): string {
  const lines: string[] = [];

  const id = invoice.IssuedInvoiceId ?? invoice.ReceivedInvoiceId ?? 'N/A';
  const number = invoice.InvoiceNumber ?? 'N/A';
  lines.push(`Invoice #${number} (ID: ${id})`);
  lines.push('='.repeat(50));

  const customer = invoice.Customer as { ID?: number; Name?: string } | undefined;
  if (customer) lines.push(`Customer: ${customer.Name ?? customer.ID}`);
  if (invoice.DateIssued) lines.push(`Date Issued: ${invoice.DateIssued}`);
  if (invoice.DateDue) lines.push(`Date Due: ${invoice.DateDue}`);
  if (invoice.Status) lines.push(`Status: ${invoice.Status}`);
  if (invoice.PaymentStatus) lines.push(`Payment: ${invoice.PaymentStatus}`);

  lines.push('');
  lines.push(`Total (excl. VAT): ${invoice.TotalWithoutVAT ?? 'N/A'}`);
  lines.push(`VAT: ${invoice.TotalVAT ?? 'N/A'}`);
  lines.push(`Total: ${invoice.TotalAmount ?? 'N/A'}`);

  const rowsKey = invoice.IssuedInvoiceRows ? 'IssuedInvoiceRows' : 'ReceivedInvoiceRows';
  const invoiceRows = invoice[rowsKey] as Record<string, unknown>[] | undefined;
  if (invoiceRows && invoiceRows.length > 0) {
    lines.push('');
    lines.push('Line Items:');
    lines.push('-'.repeat(50));
    for (const row of invoiceRows) {
      const item = row.Item as { Name?: string } | undefined;
      const desc = row.Description ?? item?.Name ?? 'N/A';
      const qty = row.Quantity ?? '';
      const price = row.Price ?? '';
      const value = row.Value ?? '';
      lines.push(`  ${desc} | Qty: ${qty} | Price: ${price} | Value: ${value}`);
    }
  }

  if (invoice.RowVersion) {
    lines.push('');
    lines.push(`RowVersion: ${invoice.RowVersion}`);
  }

  return lines.join('\n');
}
