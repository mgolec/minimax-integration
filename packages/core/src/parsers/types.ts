export interface BankTransaction {
  date: string;
  amount: number;
  description: string;
  counterpartyName?: string;
  counterpartyIBAN?: string;
  reference?: string;
  currency?: string;
}

export interface ParseResult {
  transactions: BankTransaction[];
  accountIBAN?: string;
  statementDate?: string;
  openingBalance?: number;
  closingBalance?: number;
}

export interface ColumnMapping {
  date: number | string;
  amount: number | string;
  description: number | string;
  counterpartyName?: number | string;
  counterpartyIBAN?: number | string;
  reference?: number | string;
  currency?: number | string;
  credit?: number | string;
  debit?: number | string;
}
