// Main client
export { MinimaxClient } from './client.js';

// Config
export { resolveConfig, type MinimaxConfig } from './config.js';

// Auth
export { TokenManager } from './auth.js';

// HTTP
export { HttpClient } from './http.js';

// Rate limiter
export { RateLimiter, type RateLimitStatus } from './rate-limiter.js';

// Errors
export {
  MinimaxError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NotFoundError,
  ConcurrencyError,
} from './errors.js';

// Types
export type { FkField, SearchResult, ListParams } from './types/common.js';
export { InvoiceStatus, ReceivedInvoiceStatus, PaymentStatus, JournalType } from './types/enums.js';
export type { Organisation } from './types/organisation.js';
export type { Dashboard } from './types/dashboard.js';
export type { Customer, CustomerCreateInput } from './types/customer.js';
export type {
  IssuedInvoice,
  IssuedInvoiceCreateInput,
  IssuedInvoiceRow,
  IssuedInvoiceAction,
} from './types/issued-invoice.js';
export type { ReceivedInvoice, ReceivedInvoiceRow } from './types/received-invoice.js';
export type { InboxItem, InboxAttachment } from './types/inbox.js';
export type { Journal, JournalCreateInput, JournalEntry, VatEntry } from './types/journal.js';

// Modules
export { OrganisationsModule } from './modules/organisations.js';
export { DashboardModule } from './modules/dashboard.js';
export { CustomersModule } from './modules/customers.js';
export { IssuedInvoicesModule, type IssuedInvoiceListParams } from './modules/issued-invoices.js';
export { ReceivedInvoicesModule, type ReceivedInvoiceListParams } from './modules/received-invoices.js';
export { InboxModule } from './modules/inbox.js';
export { JournalsModule } from './modules/journals.js';
export { ItemsModule, type Item } from './modules/items.js';

// Parsers
export {
  parseBankStatement,
  parseCsv,
  parseMt940,
  parseCamt053,
  detectFormat,
  type BankStatementFormat,
  type ParseOptions,
  type BankTransaction,
  type ParseResult,
  type ColumnMapping,
} from './parsers/index.js';
