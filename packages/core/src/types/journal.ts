import type { FkField } from './common.js';

export interface JournalEntry {
  JournalEntryId?: number;
  Account?: FkField;
  Customer?: FkField;
  Description?: string;
  Debit?: number;
  Credit?: number;
  Currency?: FkField;
  ExchangeRate?: number;
  [key: string]: unknown;
}

export interface Journal {
  JournalId: number;
  DocumentNumber?: string;
  DocumentNumbering?: FkField;
  DateDocument?: string;
  Description?: string;
  Status?: string;
  JournalType?: string;
  TotalDebit?: number;
  TotalCredit?: number;
  RowVersion?: string;
  JournalEntries?: JournalEntry[];
  [key: string]: unknown;
}

export interface JournalCreateInput {
  DocumentNumbering?: FkField;
  DateDocument: string;
  Description?: string;
  JournalType?: string;
  JournalEntries: JournalEntry[];
  [key: string]: unknown;
}

export interface VatEntry {
  VatId?: number;
  VATRate?: FkField;
  VATBase?: number;
  VATAmount?: number;
  [key: string]: unknown;
}
