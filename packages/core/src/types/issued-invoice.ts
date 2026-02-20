import type { FkField } from './common.js';

export interface IssuedInvoiceRow {
  IssuedInvoiceRowId?: number;
  Item?: FkField;
  Description?: string;
  Quantity?: number;
  UnitOfMeasurement?: string;
  Price?: number;
  Discount?: number;
  VATRate?: FkField;
  Value?: number;
  [key: string]: unknown;
}

export interface IssuedInvoice {
  IssuedInvoiceId: number;
  InvoiceNumber?: string;
  DocumentNumbering?: FkField;
  Customer?: FkField;
  DateIssued?: string;
  DateDue?: string;
  DateTransaction?: string;
  DateOfSupply?: string;
  Status?: string;
  PaymentStatus?: string;
  Currency?: FkField;
  TotalAmount?: number;
  TotalWithoutVAT?: number;
  TotalVAT?: number;
  RowVersion?: string;
  IssuedInvoiceRows?: IssuedInvoiceRow[];
  [key: string]: unknown;
}

export interface IssuedInvoiceCreateInput {
  DocumentNumbering?: FkField;
  Customer: FkField;
  DateIssued: string;
  DateDue: string;
  DateTransaction?: string;
  DateOfSupply?: string;
  Currency?: FkField;
  IssuedInvoiceRows: IssuedInvoiceRow[];
  [key: string]: unknown;
}

export type IssuedInvoiceAction =
  | 'issue'
  | 'issueCancellation'
  | 'generatepdf'
  | 'issueAndGeneratepdf'
  | 'copytocreditnote'
  | 'copyToReverse'
  | 'sendEInvoice';
