/** Issued invoice status */
export enum InvoiceStatus {
  Draft = 'O',
  Issued = 'I',
}

/** Received invoice status */
export enum ReceivedInvoiceStatus {
  Draft = 'O',
  Confirmed = 'P',
  Rejected = 'Z',
}

/** Payment status values */
export enum PaymentStatus {
  Paid = 'Placan',
  PartiallyPaidOverdue = 'DelnoPlacanZapadel',
  UnpaidOverdue = 'NeplacanZapadel',
  PartiallyPaidNotDue = 'DelnoPlacanNezapadel',
  UnpaidNotDue = 'NeplacanNezapadel',
}

/** Journal types */
export enum JournalType {
  General = 'T',
  BankStatement = 'B',
}
