# Minimax Integration - Usage Guide

Minimax API integration providing two interfaces:
- **MCP Server** - for use with Claude Code and other MCP-compatible LLMs
- **CLI Tool** - for direct human use from the terminal

Both share the same core library and connect to the Minimax Accounting API at `moj.minimax.hr`.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Authentication Setup](#authentication-setup)
- [Configuration](#configuration)
- [CLI Usage](#cli-usage)
- [MCP Server Setup](#mcp-server-setup)
- [MCP Tools Reference](#mcp-tools-reference)
- [Common Workflows](#common-workflows)
- [Bank Statement Import](#bank-statement-import)
- [Rate Limits](#rate-limits)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js** 18 or later
- **pnpm** package manager (`npm install -g pnpm`)
- **Minimax account** with API access enabled
- **API credentials** (Client ID + Client Secret) from Seyfor/Minimax support

## Installation

```bash
# Clone and install
cd minimax-integration
pnpm install

# Build all packages
pnpm build
```

This builds three packages:
- `packages/core/` - shared API client library
- `packages/mcp-server/` - MCP server for LLMs
- `packages/cli/` - command-line tool

## Authentication Setup

Minimax uses OAuth2 with a **password grant**. You need two sets of credentials:

### 1. Developer Credentials (from Seyfor)

Contact Minimax support (`podrska@seyfor.hr`) to request:
- **Client ID**
- **Client Secret**

### 2. API User Credentials (you create these)

The API password is **separate** from your web login password. To set it up:

1. Log into Minimax at [moj.minimax.hr](https://moj.minimax.hr)
2. Go to **My Profile** (Moj profil)
3. Click **Edit basic data** (Uredi osnovne podatke)
4. Scroll to **"Passwords for accessing external applications"** (Lozinke za pristup vanjskim aplikacijama)
5. Click **New application** (Nova aplikacija)
6. Enter an application name and set a **username** and **password**

Use the username and password from step 6 in your configuration below.

### Finding Your Organization ID

After setting up credentials, run:

```bash
node packages/cli/dist/index.js org list --format json
```

The output shows your organization ID(s) in the `Organisation.ID` field.

## Configuration

Create a `.env` file in the project root:

```env
MINIMAX_CLIENT_ID=your_client_id
MINIMAX_CLIENT_SECRET=your_client_secret
MINIMAX_USERNAME=your_api_username
MINIMAX_PASSWORD=your_api_password
MINIMAX_ORG_ID=your_org_id
MINIMAX_BASE_URL=https://moj.minimax.hr/HR/API/api
```

| Variable | Required | Description |
|---|---|---|
| `MINIMAX_CLIENT_ID` | Yes | OAuth2 client ID from Seyfor |
| `MINIMAX_CLIENT_SECRET` | Yes | OAuth2 client secret from Seyfor |
| `MINIMAX_USERNAME` | Yes | API username (from "external app passwords" in Minimax) |
| `MINIMAX_PASSWORD` | Yes | API password (from "external app passwords" in Minimax) |
| `MINIMAX_ORG_ID` | No | Default organization ID (avoids passing `--org-id` every time) |
| `MINIMAX_BASE_URL` | No | API base URL (default: `https://moj.minimax.hr/HR/API/api`) |

Configuration is resolved in order: environment variables > `~/.minimax/config.json` > `.env` file.

---

## CLI Usage

Run commands with:

```bash
node packages/cli/dist/index.js <command> [options]
```

Or link it globally after build:

```bash
cd packages/cli && pnpm link --global
minimax <command> [options]
```

### Global Options

| Flag | Description |
|---|---|
| `--org-id <id>` | Override the default organization ID |
| `--format <table\|json>` | Output format (default: `table`) |
| `--verbose` | Enable verbose output |
| `-V, --version` | Show version |

### Organizations

```bash
# List all accessible organizations
minimax org list

# Get details for a specific org
minimax org get 12345

# Save a default org ID (stored in ~/.minimax/config.json)
minimax org set-default 12345
```

### Dashboard

```bash
# Show financial KPIs for your default org
minimax dashboard

# For a specific org
minimax dashboard --org-id 12345

# As JSON
minimax dashboard --format json
```

### Issued Invoices (Outgoing)

```bash
# List all issued invoices
minimax invoice list

# Filter by status: O=Draft, I=Issued
minimax invoice list --status I

# Filter by date range
minimax invoice list --from 2025-01-01 --to 2025-12-31

# Filter by customer
minimax invoice list --customer-id 1000001

# Get full invoice details
minimax invoice get 12345

# Create a draft invoice
minimax invoice create \
  --customer-id 1000001 \
  --date-issued 2025-02-20 \
  --date-due 2025-03-20 \
  --description "Consulting services" \
  --quantity 1 \
  --price 1000

# Issue (finalize) a draft invoice
minimax invoice issue 12345

# Generate PDF for an invoice
minimax invoice pdf 12345

# Issue and generate PDF in one step
minimax invoice issue-pdf 12345
```

### Received Invoices (Incoming)

```bash
# List received invoices
minimax received list

# Filter by status: O=Draft, P=Confirmed, Z=Rejected
minimax received list --status P

# Get details
minimax received get 67890
```

### Inbox (Document Approval)

```bash
# List pending inbox items
minimax inbox list

# Get item details and attachments
minimax inbox get 111

# Approve an item
minimax inbox approve 111 --reason "Verified and correct"

# Reject an item
minimax inbox reject 111 --reason "Incorrect amount"

# Convert approved item to a received invoice
minimax inbox to-invoice 111
```

### Journals & Bank Statements

```bash
# List journals
minimax journal list

# Get journal with all debit/credit entries
minimax journal get 555

# List all journal entries across journals
minimax journal entries

# Create a manual journal entry
minimax journal create \
  --date 2025-02-20 \
  --description "Manual adjustment" \
  --account-id 1000 \
  --debit 500 \
  --credit 0

# Import a bank statement file (see Bank Statement Import section)
minimax journal import statement.csv --format csv
```

### Customers

```bash
# List customers
minimax customer list

# Search by name
minimax customer list --search "Lucid"

# Get customer details
minimax customer get 1000001

# Create a new customer
minimax customer create \
  --name "Acme Corp" \
  --tax-number "12345678901" \
  --address "Main Street 1" \
  --city "Zagreb" \
  --email "info@acme.hr"

# Auto-create customer from Croatian tax registry
minimax customer lookup 12345678901
```

### Rate Limits

```bash
# Check current API usage
minimax rate-limits
```

---

## MCP Server Setup

The MCP server allows Claude Code (and other MCP-compatible tools) to interact with Minimax directly.

### Configure in Claude Code

Add to your project's `.claude/settings.json`:

```json
{
  "mcpServers": {
    "minimax": {
      "command": "node",
      "args": ["/path/to/minimax-integration/packages/mcp-server/dist/index.js"],
      "env": {
        "MINIMAX_CLIENT_ID": "your_client_id",
        "MINIMAX_CLIENT_SECRET": "your_client_secret",
        "MINIMAX_USERNAME": "your_api_username",
        "MINIMAX_PASSWORD": "your_api_password",
        "MINIMAX_ORG_ID": "your_org_id",
        "MINIMAX_BASE_URL": "https://moj.minimax.hr/HR/API/api"
      }
    }
  }
}
```

After adding the configuration, restart Claude Code for the MCP server to load.

### Configure in Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "minimax": {
      "command": "node",
      "args": ["/path/to/minimax-integration/packages/mcp-server/dist/index.js"],
      "env": {
        "MINIMAX_CLIENT_ID": "your_client_id",
        "MINIMAX_CLIENT_SECRET": "your_client_secret",
        "MINIMAX_USERNAME": "your_api_username",
        "MINIMAX_PASSWORD": "your_api_password",
        "MINIMAX_ORG_ID": "your_org_id",
        "MINIMAX_BASE_URL": "https://moj.minimax.hr/HR/API/api"
      }
    }
  }
}
```

---

## MCP Tools Reference

Once connected, the following 23 tools are available to the LLM:

### Organization & Overview

| Tool | Description |
|---|---|
| `list-organizations` | List all accessible Minimax organizations |
| `get-organization` | Get detailed info about a specific organization |
| `get-dashboard` | Financial overview: invoices summary, revenue/expenses, top customers/suppliers, receivables/payables |
| `get-rate-limit-status` | Check API call budget (daily and monthly usage) |

### Issued Invoices (Outgoing)

| Tool | Description |
|---|---|
| `list-issued-invoices` | List invoices with filters: status (O=Draft, I=Issued), date range, customer, payment status |
| `get-issued-invoice` | Get full invoice with line items, amounts, and RowVersion |
| `create-issued-invoice` | Create a draft invoice with customer, dates, and line items |
| `issue-invoice` | Finalize a draft invoice (changes status to Issued). Requires RowVersion |
| `issue-and-generate-pdf` | Issue invoice + generate PDF in one API call |

### Received Invoices (Incoming)

| Tool | Description |
|---|---|
| `list-received-invoices` | List with filters: status (O=Draft, P=Confirmed, Z=Rejected), dates, payment status |
| `get-received-invoice` | Full details including approval dates |

### Inbox (Document Approval)

| Tool | Description |
|---|---|
| `list-inbox-items` | List pending documents awaiting review |
| `get-inbox-item` | Item details including attachments |
| `approve-inbox-item` | Approve a document (optional reason) |
| `reject-inbox-item` | Reject a document (reason required) |
| `create-received-invoice-from-inbox` | Convert an inbox item into a received invoice |

### Journals & Bank Statements

| Tool | Description |
|---|---|
| `list-journals` | List journal entries (paginated) |
| `get-journal` | Full journal with all debit/credit postings |
| `create-journal` | Create journal entry with balanced debit/credit lines |
| `upload-bank-statement` | Parse bank statement (CSV/MT940/XML) and create journal entries |

### Customers & Reference Data

| Tool | Description |
|---|---|
| `list-customers` | Search customers by name |
| `create-customer` | Create new customer/supplier |
| `lookup-customer-by-tax` | Auto-create customer from Croatian tax registry by OIB |
| `list-items` | List items/products for reference |

---

## Common Workflows

### Invoice Workflow (via CLI)

```bash
# 1. Create a draft invoice
minimax invoice create \
  --customer-id 1000001 \
  --date-issued 2025-02-20 \
  --date-due 2025-03-20 \
  --description "Web development services" \
  --quantity 10 \
  --price 100

# 2. Review it
minimax invoice get <invoice-id> --format json

# 3. Issue and generate PDF
minimax invoice issue-pdf <invoice-id>
```

### Invoice Workflow (via MCP / Claude)

Ask Claude: *"Create an invoice for customer CMMI-Cyprus Marine dated today, due in 30 days, for consulting services 10 hours at 350 EUR, then issue it and generate a PDF."*

Claude will use `create-issued-invoice`, then `issue-and-generate-pdf`.

### Inbox Approval Workflow

```bash
# 1. See what's pending
minimax inbox list

# 2. Review a specific item
minimax inbox get <inbox-id>

# 3. Approve or reject
minimax inbox approve <inbox-id> --reason "Looks good"
minimax inbox reject <inbox-id> --reason "Wrong amount, should be 1500"

# 4. Convert approved item to received invoice
minimax inbox to-invoice <inbox-id>
```

### New Customer from Tax Number

```bash
# Auto-creates customer with data from the Croatian tax registry (FINA)
minimax customer lookup 12345678901
```

---

## Bank Statement Import

The tool can parse bank statement files in three formats and create journal entries from the transactions.

### Supported Formats

| Format | Extensions | Description |
|---|---|---|
| **CSV** | `.csv`, `.txt` | Generic CSV (most Croatian banks: PBZ, Erste, ZABA, RBA) |
| **MT940** | `.sta`, `.mt940`, `.swi` | SWIFT standard format |
| **XML camt.053** | `.xml` | ISO 20022 Bank-to-Customer Statement |

### CLI Usage

```bash
# Auto-detect format from file extension
minimax journal import bank-export.csv

# Specify format explicitly
minimax journal import statement.sta --format mt940
minimax journal import export.xml --format xml
```

### MCP Usage

The `upload-bank-statement` tool accepts raw file content as text. For CSV files you can provide custom column mappings:

```
Upload this bank statement and create journal entries:
[paste CSV content]
```

### CSV Column Mapping

By default, CSV parsing expects columns in this order: date, amount, description, counterparty name, counterparty IBAN, reference.

For the MCP tool, you can specify custom column mappings using column indices (0-based) or header names.

---

## Rate Limits

Minimax enforces API rate limits per organization:

| Limit | Value |
|---|---|
| **Daily** | 1,000 calls per 24 hours |
| **Monthly** | 20,000 calls per calendar month |

The integration tracks usage locally. Check your current budget:

```bash
minimax rate-limits
```

Or via MCP: use the `get-rate-limit-status` tool.

Tips to conserve API calls:
- Use `issue-and-generate-pdf` instead of separate `issue` + `pdf` calls
- Use `--format json` and parse results locally instead of making follow-up calls
- Set a default org ID to avoid listing organizations repeatedly

---

## Troubleshooting

### "MINIMAX_CLIENT_ID is required"

You haven't configured credentials. Create a `.env` file or set environment variables. See [Configuration](#configuration).

### "OAuth2 token request failed (400): invalid_grant"

Your API username/password is wrong. Remember:
- The API password is **not** your web login password
- You must create a separate API password in Minimax under My Profile > External application passwords
- See [Authentication Setup](#authentication-setup)

### "The resource cannot be found" (404)

Check that `MINIMAX_BASE_URL` is set to `https://moj.minimax.hr/HR/API/api` (note the uppercase `API` in the path).

### "RowVersion conflict" (409)

Someone else modified the resource between your read and write. Fetch the resource again to get the latest RowVersion, then retry the action.

### "The request is invalid" (400)

Usually means missing required fields. Check that:
- Invoice create includes `Customer`, `DateIssued`, `DateDue`, and at least one row
- Journal entries have balanced debits and credits
- Dates are in `YYYY-MM-DD` format

### Rate limit errors

You've hit the daily (1,000) or monthly (20,000) call limit. Wait for the reset or check `minimax rate-limits` to see when it resets.
