export interface Dashboard {
  Revenue?: number;
  Expenses?: number;
  Profit?: number;
  AccountsReceivable?: number;
  AccountsPayable?: number;
  CashBalance?: number;
  OverdueReceivables?: number;
  OverduePayables?: number;
  UnpaidIssuedInvoices?: number;
  UnpaidReceivedInvoices?: number;
  [key: string]: unknown;
}
