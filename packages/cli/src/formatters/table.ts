import Table from 'cli-table3';
import chalk from 'chalk';
import type { Organisation } from '@minimax-api/core';
import type { IssuedInvoice } from '@minimax-api/core';
import type { Customer } from '@minimax-api/core';
import type { InboxItem } from '@minimax-api/core';
import type { Journal } from '@minimax-api/core';
import type { Dashboard } from '@minimax-api/core';

export function formatTable(rows: Record<string, unknown>[], columns: { key: string; label: string }[]): string {
  const table = new Table({
    head: columns.map((c) => chalk.bold(c.label)),
    style: { head: [] },
  });
  for (const row of rows) {
    table.push(columns.map((c) => String(row[c.key] ?? '')));
  }
  return table.toString();
}

export function formatOrgsTable(orgs: Organisation[]): string {
  const table = new Table({
    head: [chalk.bold('ID'), chalk.bold('Name'), chalk.bold('Tax Number'), chalk.bold('Country')],
    style: { head: [] },
  });
  for (const org of orgs) {
    table.push([
      String(org.OrganisationId),
      org.Name ?? '',
      org.TaxNumber ?? '',
      org.Country ?? '',
    ]);
  }
  return table.toString();
}

export function formatInvoicesTable(invoices: IssuedInvoice[]): string {
  const table = new Table({
    head: [
      chalk.bold('ID'),
      chalk.bold('Number'),
      chalk.bold('Customer'),
      chalk.bold('Date Issued'),
      chalk.bold('Total'),
      chalk.bold('Status'),
      chalk.bold('Payment'),
    ],
    style: { head: [] },
  });
  for (const inv of invoices) {
    table.push([
      String(inv.IssuedInvoiceId),
      inv.InvoiceNumber ?? '',
      inv.Customer?.Name ?? '',
      inv.DateIssued ?? '',
      inv.TotalAmount != null ? inv.TotalAmount.toFixed(2) : '',
      inv.Status ?? '',
      inv.PaymentStatus ?? '',
    ]);
  }
  return table.toString();
}

export function formatCustomersTable(customers: Customer[]): string {
  const table = new Table({
    head: [
      chalk.bold('ID'),
      chalk.bold('Name'),
      chalk.bold('Code'),
      chalk.bold('Tax Number'),
      chalk.bold('City'),
      chalk.bold('Email'),
    ],
    style: { head: [] },
  });
  for (const c of customers) {
    table.push([
      String(c.CustomerId),
      c.Name ?? '',
      c.Code ?? '',
      c.TaxNumber ?? '',
      c.City ?? '',
      c.Email ?? '',
    ]);
  }
  return table.toString();
}

export function formatInboxTable(items: InboxItem[]): string {
  const table = new Table({
    head: [
      chalk.bold('ID'),
      chalk.bold('Doc Number'),
      chalk.bold('Description'),
      chalk.bold('Customer'),
      chalk.bold('Date Received'),
      chalk.bold('Amount'),
      chalk.bold('Status'),
    ],
    style: { head: [] },
  });
  for (const item of items) {
    table.push([
      String(item.InboxId),
      item.DocumentNumber ?? '',
      item.Description ?? '',
      item.Customer?.Name ?? '',
      item.DateReceived ?? '',
      item.TotalAmount != null ? item.TotalAmount.toFixed(2) : '',
      item.Status ?? '',
    ]);
  }
  return table.toString();
}

export function formatJournalsTable(journals: Journal[]): string {
  const table = new Table({
    head: [
      chalk.bold('ID'),
      chalk.bold('Doc Number'),
      chalk.bold('Date'),
      chalk.bold('Description'),
      chalk.bold('Total Debit'),
      chalk.bold('Total Credit'),
      chalk.bold('Status'),
    ],
    style: { head: [] },
  });
  for (const j of journals) {
    table.push([
      String(j.JournalId),
      j.DocumentNumber ?? '',
      j.DateDocument ?? '',
      j.Description ?? '',
      j.TotalDebit != null ? j.TotalDebit.toFixed(2) : '',
      j.TotalCredit != null ? j.TotalCredit.toFixed(2) : '',
      j.Status ?? '',
    ]);
  }
  return table.toString();
}

export function formatDashboard(data: Dashboard): string {
  const table = new Table({
    style: { head: [] },
  });
  const fmt = (v: number | undefined) => (v != null ? v.toFixed(2) : 'N/A');

  table.push(
    { [chalk.bold('Revenue')]: fmt(data.Revenue) },
    { [chalk.bold('Expenses')]: fmt(data.Expenses) },
    { [chalk.bold('Profit')]: fmt(data.Profit) },
    { [chalk.bold('Cash Balance')]: fmt(data.CashBalance) },
    { [chalk.bold('Accounts Receivable')]: fmt(data.AccountsReceivable) },
    { [chalk.bold('Accounts Payable')]: fmt(data.AccountsPayable) },
    { [chalk.bold('Overdue Receivables')]: fmt(data.OverdueReceivables) },
    { [chalk.bold('Overdue Payables')]: fmt(data.OverduePayables) },
    { [chalk.bold('Unpaid Issued Invoices')]: fmt(data.UnpaidIssuedInvoices) },
    { [chalk.bold('Unpaid Received Invoices')]: fmt(data.UnpaidReceivedInvoices) },
  );
  return table.toString();
}
