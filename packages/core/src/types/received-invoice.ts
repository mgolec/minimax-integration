import type { FkField } from './common.js';

export interface ReceivedInvoiceRow {
  ReceivedInvoiceRowId?: number;
  Item?: FkField;
  Description?: string;
  Quantity?: number;
  Price?: number;
  Discount?: number;
  VATRate?: FkField;
  Value?: number;
  [key: string]: unknown;
}

export interface ReceivedInvoice {
  ReceivedInvoiceId: number;
  InvoiceNumber?: string;
  DocumentNumbering?: FkField;
  Customer?: FkField;
  DateIssued?: string;
  DateReceived?: string;
  DateDue?: string;
  DateTransaction?: string;
  Status?: string;
  PaymentStatus?: string;
  Currency?: FkField;
  TotalAmount?: number;
  TotalWithoutVAT?: number;
  TotalVAT?: number;
  RowVersion?: string;
  ReceivedInvoiceRows?: ReceivedInvoiceRow[];
  [key: string]: unknown;
}
