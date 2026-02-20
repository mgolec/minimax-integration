# Minimax Accounting API Integration - Complete Implementation Plan

> This document is the authoritative implementation plan for the Minimax integration project.
> It contains all technical details needed for Claude Code to execute the full implementation.

---

## 1. Context & Goal

Minimax is a Croatian accounting/ERP solution. This project builds a **TypeScript monorepo** that provides:

1. **`@minimax-api/core`** - Shared API client library (auth, HTTP, types, API modules, bank statement parsers)
2. **`@minimax-api/mcp-server`** - MCP server exposing 23 tools for Claude Code LLM integration
3. **`@minimax-api/cli`** - Human-friendly CLI tool

**Key user workflows to enable:**
- Manage cash flow (view dashboard/financial data)
- Upload and parse bank statements (CSV/MT940/XML) → create journal entries
- Create and issue outgoing invoices
- Check, approve, or reject incoming invoices/documents (ulazni dokumenti) via Inbox
- Query latest financial state

---

## 2. Minimax API Reference

### 2.1 Endpoints & Authentication

| Item | Value |
|---|---|
| API Base URL | `https://moj.minimax.hr/HR/api` |
| Auth URL | `https://moj.minimax.hr/HR/AUT/oauth20/token` |
| Auth Method | OAuth2 `grant_type=password` |
| Swagger UI | `https://moj.minimax.hr/HR/API` |
| Rate Limit (daily) | 1,000 API calls per org per rolling 24h |
| Rate Limit (monthly) | 20,000 API calls per org per month |
| Volume limits | Up to 1,000 invoices/month, 1,000 stock entries/month, 50,000 journal rows/month |

### 2.2 OAuth2 Token Request

```
POST https://moj.minimax.hr/HR/AUT/oauth20/token
Content-Type: application/x-www-form-urlencoded

grant_type=password
&client_id={MINIMAX_CLIENT_ID}
&client_secret={MINIMAX_CLIENT_SECRET}
&username={MINIMAX_USERNAME}
&password={MINIMAX_PASSWORD}
&scope=minimax.si
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

Use the token in all subsequent requests:
```
Authorization: Bearer {access_token}
```

### 2.3 All 44 API Modules

Account, Address, Analytic, BankAccount, ClassificationOfProductByActivity, Contact, Country, Currency, Customer, Dashboard, Document, DocumentNumbering, Employee, ExchangeRate, Inbox, IssuedInvoice, IssuedInvoicePosting, Item, Journal, JournalType, Order, Organisation, Outbox, PaymentMethod, PayrollSettings, PostalCode, ProductGroup, PurposeCode, ReceivedInvoice, ReportTemplate, Stock, StockEntry, User, VatAccountingType, VatRate, Warehouse.

### 2.4 Organisation Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/orgs/allOrgs/{startRowIndex}/{endRowIndex}/{searchString}` | List all organizations |
| GET | `/api/orgs/{organisationId}` | Get organization details |

### 2.5 IssuedInvoice Endpoints (Izlazni racuni - Outgoing)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/orgs/{orgId}/issuedinvoices` | Create new issued invoice |
| GET | `/api/orgs/{orgId}/issuedinvoices` | List all issued invoices |
| GET | `/api/orgs/{orgId}/issuedinvoices/{id}` | Get single issued invoice |
| PUT | `/api/orgs/{orgId}/issuedinvoices/{id}` | Update issued invoice |
| DELETE | `/api/orgs/{orgId}/issuedinvoices/{id}` | Delete issued invoice |
| PUT | `/api/orgs/{orgId}/issuedinvoices/{id}/actions/{actionName}_{rowVersion}` | Execute action |
| POST | `/api/orgs/{orgId}/issuedinvoices/{id}/attachments` | Add attachment |
| GET | `/api/orgs/{orgId}/issuedinvoices/{id}/attachments` | List attachments |
| GET | `/api/orgs/{orgId}/issuedinvoices/paymentmethods` | List payment methods |
| GET | `/api/orgs/{orgId}/issuedinvoices/synccandidates` | Sync candidates |

**Available actions** (used in PUT `.../actions/{actionName}_{rowVersion}`):
- `issue` - Finalize draft invoice
- `issueCancellation` - Cancel issued invoice (supports `issueCancellationReason` param)
- `generatepdf` - Generate PDF
- `issueAndGeneratepdf` - Issue + generate PDF in one call
- `copytocreditnote` - Copy to credit note
- `copyToReverse` - Copy to reverse
- `sendEInvoice` - Send e-invoice

### 2.6 IssuedInvoice Data Model

```typescript
interface IssuedInvoice {
  IssuedInvoiceId: number;          // Read-only, ignored on create
  Year: number;                      // Read-only
  InvoiceNumber: number;             // Read-only
  DocumentNumbering: FkField;        // Document numbering scheme
  DocumentReference: string;
  Status: 'O' | 'I';               // O=Draft, I=Issued (read-only)
  InvoiceType: 'R' | 'P';          // R=Invoice, P=Proforma
  DateIssued: string;                // ISO date
  DateTransaction: string;
  DateTransactionFrom: string;
  DateDue: string;
  DateCreditNote: string;
  Customer: FkField;
  Currency: FkField;
  ExchangeRate: number;
  Rabate: number;                    // Discount percentage
  InvoiceValue: number;              // Read-only, domestic currency
  PaidValue: number;                 // Read-only, domestic currency
  PaymentStatus: PaymentStatusEnum;  // Read-only
  PaymentReference: string;          // Read-only
  PricesOnInvoice: 'D' | 'N';      // D=VAT included, N=VAT added
  Analytic: FkField;
  Employee: FkField;
  Document: FkField;                 // Read-only
  // Addressee fields
  AddresseeName: string;
  AddresseeAddress: string;
  AddresseePostalCode: string;
  AddresseeCity: string;
  AddresseeCountry: FkField;
  AddresseeCountryName: string;      // Prohibited if country is home
  AddresseeGLN: string;
  // Recipient fields (if different from addressee)
  RecipientName: string;
  RecipientAddress: string;
  RecipientPostalCode: string;
  RecipientCity: string;
  RecipientCountry: FkField;
  RecipientCountryName: string;
  RecipientGLN: string;
  // Description
  DescriptionAbove: string;
  DescriptionBelow: string;
  Notes: string;
  // Config
  RecurringInvoice: 'D' | 'N';
  InvoiceForPeriod: 'D' | 'N';
  AssociationWithStock: 'D' | 'N';
  // Report templates
  IssuedInvoiceReportTemplate: FkField; // IR, DP, UP, PR, PUPN
  DeliveryNoteReportTemplate: FkField;  // DO
  // Attachments
  InvoiceAttachment: DocumentAttachment;
  EInvoiceAttachment: DocumentAttachment;
  // Line items
  IssuedInvoiceRows: IssuedInvoiceRow[];
  IssuedInvoicePaymentMethods: IssuedInvoicePaymentMethod[];
  IssuedInvoiceAdditionalSourceDocument: IssuedInvoiceAdditionalSourceDocument[];
  // Metadata
  RecordDtModified: string;
  RowVersion: string;                // REQUIRED for updates/actions (concurrency control)
}

interface IssuedInvoiceRow {
  IssuedInvoiceRowId: number;
  Item: FkField;
  ItemName: string;
  RowNumber: number;
  ItemCode: string;
  SerialNumber: string;
  BatchNumber: string;
  Description: string;
  Quantity: number;
  UnitOfMeasurement: string;
  Mass: number;
  Price: number;
  PriceWithVAT: number;
  VATPercent: number;
  Discount: number;
  DiscountPercent: number;
  Value: number;
  VatRate: FkField;
  VatRatePercentage: FkField;
  Warehouse: FkField;
  AdditionalWarehouse: FkField;
  TaxFreeValue: number;
  TaxExemptionValue: number;
  OtherTaxesAndDuties: number;
  VatAccountingType: string;
  TaxExemptionReasonCode: string;
  Analytic: FkField;
  RecordDtModified: string;
  RowVersion: string;
}

interface IssuedInvoicePaymentMethod {
  IssuedInvoicePaymentMethodId: number;
  PaymentMethod: FkField;
  IssuedInvoiceCancellation: FkField;
  CashRegister: FkField;
  Revenue: FkField;
  RevenueDate: string;
  Amount: number;
  AmountInDomesticCurrency: number;
  AlreadyPaid: number;
  RecordDtModified: string;
  RowVersion: string;
}

interface IssuedInvoiceAdditionalSourceDocument {
  IssuedInvoiceAdditionalSourceDocumentId: number;
  SourceDocumentType: 'AAB' | 'CD' | 'CT' | 'ON' | 'VN' | 'AEP' | 'ALO' | 'GC' | 'ATS';
  SourceDocumentDate: string;
  SourceDocumentNumber: string;
  RecordDtModified: string;
  RowVersion: string;
}
```

### 2.7 ReceivedInvoice Endpoints (Ulazni racuni - Incoming)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/orgs/{orgId}/receivedinvoices` | Create received invoice |
| GET | `/api/orgs/{orgId}/receivedinvoices` | List all received invoices |
| GET | `/api/orgs/{orgId}/receivedinvoices/{id}` | Get single received invoice |
| PUT | `/api/orgs/{orgId}/receivedinvoices/{id}` | Update received invoice |
| DELETE | `/api/orgs/{orgId}/receivedinvoices/{id}` | Delete received invoice |
| POST | `/api/orgs/{orgId}/receivedinvoices/{id}/attachments` | Add attachment |
| GET | `/api/orgs/{orgId}/receivedinvoices/{id}/attachments` | List attachments |

### 2.8 ReceivedInvoice Data Model

```typescript
interface ReceivedInvoice {
  ReceivedInvoiceId: number;         // Ignored on create
  Year: number;                       // Read-only
  InvoiceNumber: number;              // Read-only
  DocumentNumbering: FkField;
  DocumentReference: string;
  Customer: FkField;
  Employee: FkField;
  Analytic: FkField;
  Currency: FkField;
  DateIssued: string;
  DateTransaction: string;
  DateDue: string;
  DateReceived: string;
  DateApproved: string;
  InvoiceAmount: number;
  InvoiceAmountDomesticCurrency: number;
  Status: 'O' | 'P' | 'Z';         // O=Draft, P=Confirmed, Z=Rejected (read-only)
  BankAccount: FkField;              // Customer bank account
  PaymentReferenceType: string;
  PaymentReferenceModel: string;
  PaymentReferenceNumber: string;
  Notes: string;
  PaymentType: 'D' | 'N' | 'Z' | 'P' | 'R' | 'B';
  // D=Order, N=None, Z=Private, P=Employee, R=Another, B=Cash
  RevenueExpense: FkField;           // Expense when paid by cash book
  CashRegister: FkField;
  DateExpense: string;
  RecurringInvoice: 'D' | 'N';
  PaymentStatus: PaymentStatusEnum;   // Read-only
  InvoiceValue: number;               // Read-only
  PaidValue: number;                  // Read-only
  RecordDtModified: string;
  RowVersion: string;
}
```

### 2.9 Inbox Endpoints (Incoming documents for approval)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/orgs/{orgId}/inbox` | Add item to inbox |
| GET | `/api/orgs/{orgId}/inbox` | List all inbox items |
| GET | `/api/orgs/{orgId}/inbox/{id}` | Get inbox item |
| DELETE | `/api/orgs/{orgId}/inbox/{id}` | Delete inbox item |
| PUT | `/api/orgs/{orgId}/inbox/{id}/actions/approve` | Approve (optional `approvalReason` param) |
| PUT | `/api/orgs/{orgId}/inbox/{id}/actions/reject` | Reject (optional `rejectionReason` param) |
| PUT | `/api/orgs/{orgId}/inbox/{id}/actions/createReceivedInvoice` | Convert to received invoice |
| POST | `/api/orgs/{orgId}/inbox/{id}` | Add attachments to inbox item |
| DELETE | `/api/orgs/{orgId}/inbox/{id}/attachments/{attachmentId}` | Delete attachment |

### 2.10 Journal Endpoints (Temeljnica - General ledger)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/orgs/{orgId}/journals` | Create journal |
| GET | `/api/orgs/{orgId}/journals` | List journals |
| GET | `/api/orgs/{orgId}/journals/{id}` | Get journal |
| PUT | `/api/orgs/{orgId}/journals/{id}` | Update journal |
| DELETE | `/api/orgs/{orgId}/journals/{id}` | Delete journal |
| GET | `/api/orgs/{orgId}/journals/journal-entries` | List all journal entry line items |
| GET | `/api/orgs/{orgId}/journals/vodstandard` | VOD-compliant journals |
| GET | `/api/orgs/{orgId}/journals/synccandidates` | Sync candidates |
| POST | `/api/orgs/{orgId}/journals/{id}/vat` | Add VAT entry |
| GET | `/api/orgs/{orgId}/journals/{id}/vat/{vatId}` | Get VAT entry |
| PUT | `/api/orgs/{orgId}/journals/{id}/vat/{vatId}` | Update VAT entry |
| DELETE | `/api/orgs/{orgId}/journals/{id}/vat/{vatId}` | Delete VAT entry |

### 2.11 Dashboard Endpoint

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/orgs/{orgId}/dashboards` | Financial overview/KPI data |

### 2.12 Customer Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/orgs/{orgId}/customers` | Create customer |
| POST | `/api/orgs/{orgId}/customers/addbytaxnumber({taxNumber})` | Auto-create from tax registry |
| GET | `/api/orgs/{orgId}/customers` | List customers |
| GET | `/api/orgs/{orgId}/customers/{id}` | Get customer |
| GET | `/api/orgs/{orgId}/customers/code({code})` | Get customer by code |
| GET | `/api/orgs/{orgId}/customers/synccandidates` | Sync candidates |
| PUT | `/api/orgs/{orgId}/customers/{id}` | Update customer |
| DELETE | `/api/orgs/{orgId}/customers/{id}` | Delete customer |

### 2.13 Document Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/orgs/{orgId}/documents` | Create document |
| POST | `/api/orgs/{orgId}/documents/{id}/attachments` | Add attachment |
| GET | `/api/orgs/{orgId}/documents/{id}` | Get document |
| GET | `/api/orgs/{orgId}/documents` | List documents |
| GET | `/api/orgs/{orgId}/documents/{id}/attachments/{attachmentId}` | Get attachment |
| GET | `/api/orgs/{orgId}/documents/synccandidates` | Sync candidates |
| PUT | `/api/orgs/{orgId}/documents/{id}` | Update document |
| PUT | `/api/orgs/{orgId}/documents/{id}/attachments/{attachmentId}` | Update attachment |
| DELETE | `/api/orgs/{orgId}/documents/{id}` | Delete document |
| DELETE | `/api/orgs/{orgId}/documents/{id}/attachments/{attachmentId}` | Delete attachment |

### 2.14 BankAccount Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/orgs/{orgId}/customers/{customerId}/bankAccounts` | Add bank account |
| GET | `/api/orgs/{orgId}/customers/{customerId}/bankAccounts` | List bank accounts |
| GET | `/api/orgs/{orgId}/customers/{customerId}/bankAccounts/{id}` | Get bank account |
| PUT | `/api/orgs/{orgId}/customers/{customerId}/bankAccounts/{id}` | Update bank account |
| DELETE | `/api/orgs/{orgId}/customers/{customerId}/bankAccounts/{id}` | Delete bank account |
| GET | `/api/orgs/{orgId}/customers/{customerId}/bankAccounts/synccandidates` | Sync candidates |

### 2.15 Outbox Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/orgs/{orgId}/outbox` | List all outbox items |
| GET | `/api/orgs/{orgId}/outbox/{id}` | Get outbox item |

### 2.16 Common Types

```typescript
/** Foreign key reference - used throughout the API */
interface FkField {
  ID: number;
  Name: string;
  ResourceUrl: string;
}

/** Paginated list response wrapper */
interface SearchResult<T> {
  Rows: T[];
  TotalRows: number;
  CurrentPageNumber: number;
}

/** Payment status values */
type PaymentStatusEnum =
  | 'Placan'                 // Paid
  | 'DelnoPlacanZapadel'     // Partially paid, overdue
  | 'DelnoPlacanNezapadel'   // Partially paid, not due
  | 'NeplacanZapadel'        // Unpaid, overdue
  | 'NeplacanNezapadel'      // Unpaid, not due
  | 'Osnutek'                // Draft
  | 'Avans';                 // Advance
```

### 2.17 Important Implementation Notes

1. **RowVersion**: Every PUT (update) and action requires the current RowVersion. The action URL format is: `PUT /api/orgs/{orgId}/issuedinvoices/{id}/actions/{actionName}_{rowVersion}` — note the underscore between action name and row version.

2. **FK Fields on Create**: When creating entities, FK references only need the `ID` field. `Name` and `ResourceUrl` are populated by the server in responses.

3. **Pagination**: List endpoints accept `currentPage` and `pageSize` query parameters. Response wraps results in `{ Rows: [], TotalRows: n, CurrentPageNumber: n }`.

4. **Date Format**: All dates use ISO 8601 format strings.

5. **Content Type**: All POST/PUT requests use `Content-Type: application/json`.

6. **Scope Note**: The OAuth2 scope is `minimax.si` even for the `.hr` domain (confirmed in official docs).

---

## 3. Project Structure

```
minimax-integration/
├── package.json                     # Root workspace config
├── pnpm-workspace.yaml              # pnpm workspace: packages/*
├── tsconfig.json                    # Project references to all packages
├── tsconfig.base.json               # Shared compiler options
├── .env.example                     # Credential template
├── .gitignore
├── IMPLEMENTATION_PLAN.md           # This file
│
├── packages/
│   ├── core/                        # @minimax-api/core
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts
│   │   ├── src/
│   │   │   ├── index.ts             # Public barrel export
│   │   │   ├── client.ts            # MinimaxClient main class (facade)
│   │   │   ├── http.ts              # HTTP client (native fetch + auth + retry)
│   │   │   ├── auth.ts              # OAuth2 TokenManager
│   │   │   ├── config.ts            # Config resolution (env → file → defaults)
│   │   │   ├── errors.ts            # Typed error hierarchy
│   │   │   ├── rate-limiter.ts      # Rate limit tracker (file-persisted)
│   │   │   ├── types/
│   │   │   │   ├── index.ts         # Barrel export
│   │   │   │   ├── common.ts        # FkField, SearchResult, ListParams
│   │   │   │   ├── enums.ts         # All status/type enums
│   │   │   │   ├── organisation.ts
│   │   │   │   ├── dashboard.ts
│   │   │   │   ├── issued-invoice.ts
│   │   │   │   ├── received-invoice.ts
│   │   │   │   ├── inbox.ts
│   │   │   │   ├── journal.ts
│   │   │   │   ├── customer.ts
│   │   │   │   ├── item.ts
│   │   │   │   └── currency.ts
│   │   │   ├── parsers/
│   │   │   │   ├── index.ts         # Parser factory (auto-detect format by extension/content)
│   │   │   │   ├── types.ts         # BankTransaction interface
│   │   │   │   ├── csv-parser.ts    # CSV with configurable column mapping
│   │   │   │   ├── mt940-parser.ts  # SWIFT MT940 format
│   │   │   │   └── xml-camt053-parser.ts  # ISO 20022 camt.053
│   │   │   └── modules/
│   │   │       ├── organisations.ts
│   │   │       ├── dashboard.ts
│   │   │       ├── issued-invoices.ts
│   │   │       ├── received-invoices.ts
│   │   │       ├── inbox.ts
│   │   │       ├── journals.ts
│   │   │       ├── customers.ts
│   │   │       ├── items.ts
│   │   │       └── currencies.ts
│   │   └── tests/
│   │       ├── auth.test.ts
│   │       ├── client.test.ts
│   │       ├── parsers/
│   │       │   ├── csv-parser.test.ts
│   │       │   ├── mt940-parser.test.ts
│   │       │   └── xml-parser.test.ts
│   │       └── modules/
│   │           ├── issued-invoices.test.ts
│   │           └── inbox.test.ts
│   │
│   ├── mcp-server/                  # @minimax-api/mcp-server
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts
│   │   ├── src/
│   │   │   ├── index.ts             # Entry: create server + stdio transport
│   │   │   ├── server.ts            # McpServer setup + registerAllTools()
│   │   │   ├── helpers.ts           # toolSuccess(), toolError() formatting
│   │   │   └── tools/
│   │   │       ├── organisation.ts  # list-organizations, get-organization
│   │   │       ├── dashboard.ts     # get-dashboard
│   │   │       ├── issued-invoices.ts # list, get, create, issue, issue-and-pdf
│   │   │       ├── received-invoices.ts # list, get
│   │   │       ├── inbox.ts         # list, get, approve, reject, to-invoice
│   │   │       ├── journals.ts      # list, get, create, upload-bank-statement
│   │   │       ├── customers.ts     # list, create, lookup-by-tax
│   │   │       └── reference-data.ts # list-items, list-currencies, rate-limits
│   │   └── tests/
│   │
│   └── cli/                         # @minimax-api/cli
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsup.config.ts
│       ├── src/
│       │   ├── index.ts             # Entry: #!/usr/bin/env node
│       │   ├── program.ts           # Commander program definition
│       │   ├── commands/
│       │   │   ├── auth.ts          # login, status, logout
│       │   │   ├── org.ts           # list, get, set-default
│       │   │   ├── dashboard.ts     # dashboard overview
│       │   │   ├── invoice.ts       # list, get, create, issue, pdf, issue-pdf
│       │   │   ├── received.ts      # list, get
│       │   │   ├── inbox.ts         # list, get, approve, reject, to-invoice
│       │   │   ├── journal.ts       # list, get, create, import (bank statement)
│       │   │   └── customer.ts      # list, get, create, lookup
│       │   └── formatters/
│       │       ├── table.ts         # cli-table3 table output
│       │       └── json.ts          # JSON output
│       └── tests/
```

---

## 4. Core Library Detailed Specifications

### 4.1 Configuration (`config.ts`)

```typescript
export interface MinimaxConfig {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  baseUrl: string;           // Default: 'https://moj.minimax.hr/HR/api'
  authUrl: string;           // Default: 'https://moj.minimax.hr/HR/AUT/oauth20/token'
  defaultOrgId?: number;
  timeout: number;           // Default: 30000 ms
  retryAttempts: number;     // Default: 3
}

// Resolution order:
// 1. Explicit config passed to MinimaxClient constructor
// 2. Environment variables:
//    MINIMAX_CLIENT_ID, MINIMAX_CLIENT_SECRET, MINIMAX_USERNAME,
//    MINIMAX_PASSWORD, MINIMAX_ORG_ID, MINIMAX_BASE_URL, MINIMAX_AUTH_URL
// 3. Config file: ~/.minimax/config.json
// 4. .env file in cwd (loaded via dotenv)

export function resolveConfig(partial?: Partial<MinimaxConfig>): MinimaxConfig;
```

### 4.2 Authentication (`auth.ts`)

```typescript
export class TokenManager {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private refreshBufferMs = 60_000; // Refresh 60s before expiry

  constructor(private config: MinimaxConfig) {}

  async getToken(): Promise<string>;     // Returns valid token, refreshing if needed
  async refreshToken(): Promise<string>; // Force acquire new token
  isTokenValid(): boolean;               // Check if cached token is still valid

  // Internal: POST to authUrl with grant_type=password
  private async acquireToken(): Promise<{ access_token: string; expires_in: number }>;
}
```

### 4.3 HTTP Client (`http.ts`)

```typescript
export class HttpClient {
  constructor(
    private config: MinimaxConfig,
    private tokenManager: TokenManager,
    private rateLimiter: RateLimiter
  ) {}

  async get<T>(path: string, params?: Record<string, string | number>): Promise<T>;
  async post<T>(path: string, body: unknown): Promise<T>;
  async put<T>(path: string, body?: unknown): Promise<T>;
  async delete(path: string): Promise<void>;
  async upload<T>(path: string, file: Buffer, filename: string): Promise<T>;

  // Internal: prepend baseUrl, inject Bearer token, handle errors, track rate limits
  private async request<T>(method: string, path: string, options?: {
    body?: unknown;
    params?: Record<string, string | number>;
    contentType?: string;
  }): Promise<T>;
}
```

**Error mapping:**
- 401 → `AuthenticationError`
- 403 → `MinimaxError('FORBIDDEN')`
- 404 → `NotFoundError`
- 409 → `ConcurrencyError`
- 422 → `ValidationError`
- 429 → `RateLimitError`
- 500+ → `MinimaxError('SERVER_ERROR')`

**Retry logic:** Exponential backoff on 429/5xx, max 3 retries, initial delay 1s, max delay 10s.

### 4.4 Error Classes (`errors.ts`)

```typescript
export class MinimaxError extends Error {
  constructor(message: string, public readonly code: string) { super(message); }
}
export class AuthenticationError extends MinimaxError {
  constructor(message = 'Authentication failed') { super(message, 'AUTH_FAILED'); }
}
export class RateLimitError extends MinimaxError {
  constructor(message: string, public readonly retryAfter: number | null = null) {
    super(message, 'RATE_LIMITED');
  }
}
export class ValidationError extends MinimaxError {
  constructor(message: string, public readonly fields: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR');
  }
}
export class NotFoundError extends MinimaxError {
  constructor(resource: string, id: number | string) {
    super(`${resource} with ID ${id} not found`, 'NOT_FOUND');
  }
}
export class ConcurrencyError extends MinimaxError {
  constructor() {
    super('Record modified by another user. Refresh to get current RowVersion.', 'CONCURRENCY');
  }
}
```

### 4.5 Rate Limiter (`rate-limiter.ts`)

```typescript
export class RateLimiter {
  private storePath: string; // ~/.minimax/rate-limits.json

  async trackCall(): Promise<void>;
  canMakeCall(): boolean;
  getStatus(): { dailyUsed: number; dailyLimit: 1000; monthlyUsed: number; monthlyLimit: 20000; };
  async load(): Promise<void>;
  async save(): Promise<void>;
}
```

### 4.6 API Modules (Pattern)

Each module follows this pattern:

```typescript
// Example: modules/issued-invoices.ts
export class IssuedInvoicesModule {
  constructor(private http: HttpClient) {}

  async list(orgId: number, params?: {
    currentPage?: number;
    pageSize?: number;
    // Module-specific filters
  }): Promise<SearchResult<IssuedInvoice>>;

  async get(orgId: number, id: number): Promise<IssuedInvoice>;
  async create(orgId: number, data: Partial<IssuedInvoice>): Promise<IssuedInvoice>;
  async update(orgId: number, id: number, data: IssuedInvoice): Promise<IssuedInvoice>;
  async delete(orgId: number, id: number): Promise<void>;

  // Actions - note the URL pattern: .../actions/{actionName}_{rowVersion}
  async issue(orgId: number, id: number, rowVersion: string): Promise<IssuedInvoice>;
  async generatePdf(orgId: number, id: number, rowVersion: string): Promise<IssuedInvoice>;
  async issueAndGeneratePdf(orgId: number, id: number, rowVersion: string): Promise<IssuedInvoice>;
  async issueCancellation(orgId: number, id: number, rowVersion: string, reason?: string): Promise<IssuedInvoice>;
  async copyToCreditNote(orgId: number, id: number, rowVersion: string): Promise<IssuedInvoice>;

  async listAttachments(orgId: number, id: number): Promise<Attachment[]>;
  async addAttachment(orgId: number, id: number, file: Buffer, filename: string): Promise<Attachment>;
  async getPaymentMethods(orgId: number): Promise<PaymentMethod[]>;
}
```

**Inbox module special actions:**
```typescript
export class InboxModule {
  // ...standard CRUD...
  async approve(orgId: number, id: number, reason?: string): Promise<void>;
  async reject(orgId: number, id: number, reason?: string): Promise<void>;
  async createReceivedInvoice(orgId: number, id: number): Promise<void>;
  async addAttachments(orgId: number, id: number, file: Buffer, filename: string): Promise<void>;
  async deleteAttachment(orgId: number, id: number, attachmentId: number): Promise<void>;
}
```

### 4.7 Main Client (`client.ts`)

```typescript
export class MinimaxClient {
  readonly organisations: OrganisationsModule;
  readonly dashboard: DashboardModule;
  readonly issuedInvoices: IssuedInvoicesModule;
  readonly receivedInvoices: ReceivedInvoicesModule;
  readonly inbox: InboxModule;
  readonly journals: JournalsModule;
  readonly customers: CustomersModule;
  readonly items: ItemsModule;
  readonly currencies: CurrenciesModule;

  constructor(config?: Partial<MinimaxConfig>) {
    const resolved = resolveConfig(config);
    // Initialize TokenManager, RateLimiter, HttpClient
    // Initialize all modules with the shared HttpClient
  }

  async testConnection(): Promise<boolean>; // Acquire token + GET organisations
  getRateLimitStatus(): RateLimitStatus;
}
```

### 4.8 Bank Statement Parsers (`parsers/`)

```typescript
// parsers/types.ts
export interface BankTransaction {
  date: string;              // ISO date
  amount: number;            // Positive = credit, negative = debit
  description: string;
  counterpartyName?: string;
  counterpartyIBAN?: string;
  reference?: string;        // Payment reference (model + number)
  currency?: string;
}

export interface BankStatementParser {
  parse(content: string | Buffer): BankTransaction[];
}

// parsers/index.ts
export function createParser(format: 'csv' | 'mt940' | 'xml', options?: ParserOptions): BankStatementParser;
export function detectFormat(filePath: string): 'csv' | 'mt940' | 'xml';

// parsers/csv-parser.ts
export interface CsvParserOptions {
  delimiter?: string;        // Default: ','
  dateColumn: string;        // Column name for date
  amountColumn: string;      // Column name for amount
  descriptionColumn: string;
  counterpartyColumn?: string;
  referenceColumn?: string;
  dateFormat?: string;       // Default: 'YYYY-MM-DD'
  encoding?: string;         // Default: 'utf-8'
  skipRows?: number;         // Header rows to skip
}

// Bank-specific presets stored in ~/.minimax/bank-mappings.json
// Presets for: PBZ, Erste, ZABA, RBA
```

---

## 5. MCP Server - Complete Tool Registry (23 tools)

### 5.1 Server Setup

```typescript
// packages/mcp-server/src/index.ts
import { McpServer, StdioServerTransport } from '@modelcontextprotocol/server';
import { MinimaxClient } from '@minimax-api/core';

const client = new MinimaxClient(); // Reads from env vars
const server = new McpServer({ name: 'minimax-accounting', version: '1.0.0' });
registerAllTools(server, client);
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 5.2 Tool Definitions

Each tool below shows: name, description (for LLM), Zod input schema, and behavior.

#### Organization Tools

**`list-organizations`**
- Description: "List all Minimax organizations accessible with current credentials. Returns org names, IDs, and tax numbers. Use this first to find the correct organisationId for subsequent operations."
- Input: `{ searchString?: z.string() }`
- Calls: `client.organisations.list(searchString)`

**`get-organization`**
- Description: "Get detailed information about a specific Minimax organization including address, fiscal year, and default currency."
- Input: `{ orgId: z.number() }`
- Calls: `client.organisations.get(orgId)`

#### Dashboard

**`get-dashboard`**
- Description: "Get financial dashboard for an organization. Returns revenue, expenses, profit, cash position, outstanding receivables and payables. Best tool for a quick financial health check."
- Input: `{ orgId?: z.number().describe("Uses default org if omitted") }`
- Calls: `client.dashboard.get(orgId)`

#### Issued Invoices

**`list-issued-invoices`**
- Description: "List outgoing/issued invoices (izlazni racuni). Supports filtering by status, date range, customer, and payment status."
- Input: `{ orgId?: number, status?: 'O'|'I', dateFrom?: string, dateTo?: string, customerId?: number, paymentStatus?: string, page?: number=1, pageSize?: number=20 }`

**`get-issued-invoice`**
- Description: "Get complete details of a specific issued invoice including all line items, payment methods, amounts, VAT breakdown, and RowVersion needed for updates."
- Input: `{ orgId?: number, invoiceId: number }`

**`create-issued-invoice`**
- Description: "Create a new outgoing invoice (draft). Requires customer and at least one line item. Created in Draft status - use issue-invoice to finalize. Dates default to today if not specified."
- Input: `{ orgId?: number, customerId: number, dateIssued?: string, dateDue?: string, invoiceType?: 'R'|'P', currencyId?: number, items: [{ itemId?: number, description: string, quantity: number, price: number, vatPercent?: number=25, discount?: number=0 }] }`

**`issue-invoice`**
- Description: "Finalize a draft invoice by changing status from Draft to Issued. Assigns final invoice number. Cannot be easily undone."
- Input: `{ orgId?: number, invoiceId: number, rowVersion: string }`

**`issue-and-generate-pdf`**
- Description: "Issue a draft invoice AND generate its PDF in one API call. More efficient than separate calls (saves rate limit budget)."
- Input: `{ orgId?: number, invoiceId: number, rowVersion: string }`

#### Received Invoices

**`list-received-invoices`**
- Description: "List incoming/received invoices (ulazni racuni) from suppliers. Filter by status (Draft/Confirmed/Rejected), date range, or payment status."
- Input: `{ orgId?: number, status?: 'O'|'P'|'Z', dateFrom?: string, dateTo?: string, paymentStatus?: string, page?: number=1, pageSize?: number=20 }`

**`get-received-invoice`**
- Description: "Get full details of a received invoice including amounts, supplier info, payment status, and approval dates."
- Input: `{ orgId?: number, invoiceId: number }`

#### Inbox (Document Approval)

**`list-inbox-items`**
- Description: "List incoming documents waiting for approval in the Inbox. These are documents (typically supplier invoices) that need to be reviewed, approved, or rejected before becoming received invoices."
- Input: `{ orgId?: number, page?: number=1, pageSize?: number=20 }`

**`get-inbox-item`**
- Description: "Get details of a specific inbox item including attachments and current status."
- Input: `{ orgId?: number, inboxId: number }`

**`approve-inbox-item`**
- Description: "Approve an incoming document in the inbox. After approval, it can be converted to a received invoice."
- Input: `{ orgId?: number, inboxId: number, reason?: string }`

**`reject-inbox-item`**
- Description: "Reject an incoming document in the inbox with a reason."
- Input: `{ orgId?: number, inboxId: number, reason: string }`

**`create-received-invoice-from-inbox`**
- Description: "Convert an approved inbox item into a received invoice. Moves the document from inbox into accounting as an official received invoice record."
- Input: `{ orgId?: number, inboxId: number }`

#### Journals & Bank Statements

**`list-journals`**
- Description: "List journal entries (temeljnice) - general ledger postings including bank statement records."
- Input: `{ orgId?: number, page?: number=1, pageSize?: number=20 }`

**`get-journal`**
- Description: "Get a journal entry with all line items (debit/credit postings) and VAT entries."
- Input: `{ orgId?: number, journalId: number }`

**`create-journal`**
- Description: "Create a new journal entry. Each journal contains rows with debit/credit account postings that must balance."
- Input: `{ orgId?: number, description: string, dateTransaction: string, journalTypeId?: number, rows: [{ accountId: number, description?: string, debit?: number=0, credit?: number=0, customerId?: number }] }`

**`upload-bank-statement`**
- Description: "Parse a bank statement file (CSV, MT940, or XML camt.053) and create journal entries from the transactions. Provide the file path and optionally specify the format and bank preset for CSV column mapping."
- Input: `{ orgId?: number, filePath: string, format?: 'csv'|'mt940'|'xml', bankPreset?: string, bankAccountId?: number, cashAccountId?: number }`

#### Customers & Reference Data

**`list-customers`**
- Description: "Search customers/suppliers (stranke) by name, code, or tax number."
- Input: `{ orgId?: number, searchString?: string, page?: number=1, pageSize?: number=20 }`

**`create-customer`**
- Description: "Create a new customer/supplier record. For Croatian companies, use lookup-customer-by-tax instead to auto-populate from the tax registry."
- Input: `{ orgId?: number, name: string, code?: string, taxNumber?: string, address?: string, city?: string, postalCode?: string, countryId?: number, email?: string, phone?: string }`

**`lookup-customer-by-tax`**
- Description: "Look up and create a customer by tax number (OIB). Minimax auto-populates company details from the Croatian tax registry."
- Input: `{ orgId?: number, taxNumber: string }`

**`get-rate-limit-status`**
- Description: "Check current API rate limit usage. Minimax allows 1,000 calls/day and 20,000 calls/month per organization."
- Input: `{}`

---

## 6. CLI Commands

```
minimax [--org-id <id>] [--format table|json|csv] [--verbose] <command>

minimax auth login                         # Interactive credentials setup
minimax auth status                        # Show token validity + org info
minimax auth logout                        # Clear stored credentials

minimax org list [--search <query>]        # List accessible organizations
minimax org get <orgId>                    # Show organization details
minimax org set-default <orgId>            # Set default org for future commands

minimax dashboard                          # Financial overview

minimax invoice list [--status O|I] [--from DATE] [--to DATE] [--customer ID]
minimax invoice get <id>
minimax invoice create --customer <id> --item <desc:qty:price[:vat]> [--item ...]
minimax invoice issue <id>
minimax invoice pdf <id>
minimax invoice issue-pdf <id>

minimax received list [--status O|P|Z] [--from DATE] [--to DATE]
minimax received get <id>

minimax inbox list
minimax inbox get <id>
minimax inbox approve <id> [--reason "..."]
minimax inbox reject <id> --reason "..."
minimax inbox to-invoice <id>

minimax journal list
minimax journal get <id>
minimax journal create --description "..." --date DATE --row <acct:debit:credit> [--row ...]
minimax journal import <file> [--format csv|mt940|xml] [--bank-preset pbz|erste|zaba|rba]
minimax journal entries

minimax customer list [--search <query>]
minimax customer get <id>
minimax customer create --name "..." [--tax "..." --address "..." --city "..."]
minimax customer lookup <taxNumber>

minimax item list [--search <query>]
minimax currency list
minimax rate-limits
```

---

## 7. Tech Stack & Dependencies

### Root devDependencies
- `typescript` ^5.7
- `tsup` ^8.0
- `vitest` ^2.0
- `eslint` ^9.0
- `@types/node` ^22

### @minimax-api/core dependencies
- `dotenv` ^16.4 (env file loading)
- `csv-parse` ^5.0 (CSV bank statement parsing)
- `fast-xml-parser` ^4.0 (XML camt.053 parsing)

### @minimax-api/mcp-server dependencies
- `@minimax-api/core` workspace:*
- `@modelcontextprotocol/server` ^2.0
- `zod` ^3.24

### @minimax-api/cli dependencies
- `@minimax-api/core` workspace:*
- `commander` ^13.0
- `@commander-js/extra-typings` ^13.0
- `chalk` ^5.3
- `cli-table3` ^0.6
- `@inquirer/prompts` ^7.0

### Build Configuration
- **Target**: ES2022
- **Module**: ESNext (ESM-first)
- **Core**: Dual ESM + CJS output
- **MCP Server**: ESM only with `#!/usr/bin/env node` banner
- **CLI**: ESM only with `#!/usr/bin/env node` banner

---

## 8. Implementation Phases (Execution Order)

### Phase 1: Foundation
**Goal**: Working auth + HTTP client that can talk to Minimax API

1. Initialize monorepo: `pnpm init`, create `pnpm-workspace.yaml`, `tsconfig.json`, `tsconfig.base.json`
2. Create `packages/core/` skeleton: `package.json`, `tsconfig.json`, `tsup.config.ts`
3. Implement `packages/core/src/config.ts` — config resolution from env/file
4. Implement `packages/core/src/errors.ts` — error class hierarchy
5. Implement `packages/core/src/auth.ts` — OAuth2 TokenManager
6. Implement `packages/core/src/rate-limiter.ts` — rate limit tracking
7. Implement `packages/core/src/http.ts` — HTTP client with auth injection + retry
8. Implement `packages/core/src/types/` — all type definitions
9. **Verify**: Build succeeds, can acquire token via `auth.ts`

### Phase 2: API Modules
**Goal**: Full programmatic API access via MinimaxClient

10. Implement `modules/organisations.ts` — simplest module, validates the pattern
11. Implement `modules/dashboard.ts`
12. Implement `modules/customers.ts` — needed before invoices
13. Implement `modules/items.ts`
14. Implement `modules/currencies.ts`
15. Implement `modules/issued-invoices.ts` — CRUD + all 6 actions + attachments
16. Implement `modules/received-invoices.ts`
17. Implement `modules/inbox.ts` — CRUD + approve/reject/createReceivedInvoice
18. Implement `modules/journals.ts` — CRUD + VAT entries + journal-entries
19. Implement `packages/core/src/client.ts` — MinimaxClient facade assembling all modules
20. Implement `packages/core/src/index.ts` — barrel export
21. **Verify**: Can list orgs, create invoice, list inbox items via client

### Phase 3: Bank Statement Parsers
**Goal**: Parse common bank statement formats into BankTransaction[]

22. Implement `parsers/types.ts` — BankTransaction interface
23. Implement `parsers/csv-parser.ts` — CSV with configurable column mapping
24. Implement `parsers/mt940-parser.ts` — MT940 SWIFT format
25. Implement `parsers/xml-camt053-parser.ts` — ISO 20022 XML
26. Implement `parsers/index.ts` — factory + format auto-detection
27. **Verify**: Parse sample bank statement files

### Phase 4: MCP Server
**Goal**: All 23 tools registered and working via stdio

28. Create `packages/mcp-server/` skeleton
29. Implement `src/helpers.ts` — toolSuccess/toolError response formatting
30. Implement `src/tools/organisation.ts` — list-organizations, get-organization
31. Implement `src/tools/dashboard.ts` — get-dashboard
32. Implement `src/tools/issued-invoices.ts` — 5 invoice tools
33. Implement `src/tools/received-invoices.ts` — 2 received invoice tools
34. Implement `src/tools/inbox.ts` — 5 inbox tools (approve/reject/convert)
35. Implement `src/tools/journals.ts` — 4 journal tools including upload-bank-statement
36. Implement `src/tools/customers.ts` — 3 customer tools
37. Implement `src/tools/reference-data.ts` — items, currencies, rate-limits
38. Implement `src/server.ts` — register all tools
39. Implement `src/index.ts` — entry point with stdio transport
40. **Verify**: Run MCP Inspector, test each tool

### Phase 5: CLI
**Goal**: Full CLI for human use

41. Create `packages/cli/` skeleton
42. Implement `src/formatters/table.ts` and `json.ts`
43. Implement `src/commands/auth.ts` — login, status, logout
44. Implement `src/commands/org.ts` — list, get, set-default
45. Implement `src/commands/dashboard.ts`
46. Implement `src/commands/invoice.ts` — list, get, create, issue, pdf, issue-pdf
47. Implement `src/commands/received.ts` — list, get
48. Implement `src/commands/inbox.ts` — list, get, approve, reject, to-invoice
49. Implement `src/commands/journal.ts` — list, get, create, import
50. Implement `src/commands/customer.ts` — list, get, create, lookup
51. Implement `src/program.ts` — assemble all commands
52. Implement `src/index.ts` — entry point
53. **Verify**: Run full workflow via CLI

### Phase 6: Polish
54. Create `.env.example` with all env vars
55. Create `.gitignore` (node_modules, dist, .env, ~/.minimax/)
56. Add MCP config example for Claude Code
57. Write tests for critical paths (auth, invoice creation, inbox approval)

---

## 9. Configuration Files Content

### .env.example
```
MINIMAX_CLIENT_ID=your_client_id
MINIMAX_CLIENT_SECRET=your_client_secret
MINIMAX_USERNAME=your_api_username
MINIMAX_PASSWORD=your_api_password
MINIMAX_ORG_ID=your_default_org_id
# MINIMAX_BASE_URL=https://moj.minimax.hr/HR/api
# MINIMAX_AUTH_URL=https://moj.minimax.hr/HR/AUT/oauth20/token
```

### pnpm-workspace.yaml
```yaml
packages:
  - 'packages/*'
```

### tsconfig.base.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  }
}
```

### MCP Server config for Claude Code (.claude/settings.json)
```json
{
  "mcpServers": {
    "minimax": {
      "command": "node",
      "args": ["./packages/mcp-server/dist/index.js"],
      "env": {
        "MINIMAX_CLIENT_ID": "...",
        "MINIMAX_CLIENT_SECRET": "...",
        "MINIMAX_USERNAME": "...",
        "MINIMAX_PASSWORD": "...",
        "MINIMAX_ORG_ID": "..."
      }
    }
  }
}
```

---

## 10. Key Risks & Mitigations

1. **RowVersion concurrency**: Every update/action needs current RowVersion. MCP tool descriptions guide LLM to always fetch before modifying. Tool responses always include RowVersion.

2. **Rate limits (1000/day)**: Rate limiter tracks usage persistently. `get-rate-limit-status` tool lets LLM self-regulate. Combined actions (issue-and-generate-pdf) save calls.

3. **FK field lookups**: Creating invoices requires Customer ID, Item ID, etc. Reference data tools (list-customers, list-items) are essential prerequisites. Tool descriptions guide the LLM.

4. **OAuth scope**: Documentation shows `scope=minimax.si` even for HR domain. Test this in Phase 1 — may need `minimax.hr`.

5. **Bank statement formats**: Croatian bank CSV formats vary. CSV parser uses configurable column mapping with bank-specific presets.
