# minimax-mcp-server

MCP (Model Context Protocol) server for the [Minimax](https://www.minimax.hr) accounting/ERP API. Gives Claude, Claude Desktop, and other MCP-compatible LLMs direct access to your Minimax data — invoices, customers, journals, inbox documents, dashboards, and more.

## Quick Start

```bash
npm install -g minimax-mcp-server
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "minimax": {
      "command": "minimax-mcp",
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

### Claude Code

Add to `.claude/settings.json` in your project:

```json
{
  "mcpServers": {
    "minimax": {
      "command": "minimax-mcp",
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

Restart Claude after adding the configuration.

## Credentials Setup

You need two sets of credentials:

### 1. Developer Credentials

Contact Minimax/Seyfor support (`podrska@seyfor.hr`) to get:
- **Client ID**
- **Client Secret**

### 2. API User Credentials

The API uses a **separate password** from your web login:

1. Log into [moj.minimax.hr](https://moj.minimax.hr)
2. Go to **My Profile** > **Edit basic data**
3. Scroll to **"Passwords for accessing external applications"**
4. Click **New application** and set a username + password

### Finding Your Organization ID

After configuring credentials, ask Claude: *"List my Minimax organizations"* — the tool will return your org ID(s).

## Available Tools (24)

### Organization & Overview
| Tool | Description |
|---|---|
| `list-organizations` | List accessible organizations |
| `get-organization` | Get organization details |
| `get-dashboard` | Financial overview: invoices, revenue/expenses, top customers/suppliers, aging |
| `get-rate-limit-status` | API call budget (daily/monthly) |

### Issued Invoices (Outgoing)
| Tool | Description |
|---|---|
| `list-issued-invoices` | List with filters (status, dates, customer, payment) |
| `get-issued-invoice` | Full invoice with line items |
| `create-issued-invoice` | Create draft invoice |
| `issue-invoice` | Finalize draft → Issued |
| `issue-and-generate-pdf` | Issue + PDF in one call |

### Received Invoices (Incoming)
| Tool | Description |
|---|---|
| `list-received-invoices` | List with filters |
| `get-received-invoice` | Full details |

### Inbox (Document Approval)
| Tool | Description |
|---|---|
| `list-inbox-items` | Pending documents for review |
| `get-inbox-item` | Item details + attachments |
| `approve-inbox-item` | Approve (optional reason) |
| `reject-inbox-item` | Reject (reason required) |
| `create-received-invoice-from-inbox` | Convert to received invoice |

### Journals & Bank Statements
| Tool | Description |
|---|---|
| `list-journals` | List journal entries |
| `get-journal` | Full debit/credit postings |
| `create-journal` | Create journal entry |
| `upload-bank-statement` | Parse CSV/MT940/XML and create journal entries |

### Customers & Reference Data
| Tool | Description |
|---|---|
| `list-customers` | Search customers |
| `create-customer` | Create customer/supplier |
| `lookup-customer-by-tax` | Auto-create from Croatian tax registry (OIB) |
| `list-items` | List products/services |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MINIMAX_CLIENT_ID` | Yes | OAuth2 client ID |
| `MINIMAX_CLIENT_SECRET` | Yes | OAuth2 client secret |
| `MINIMAX_USERNAME` | Yes | API username |
| `MINIMAX_PASSWORD` | Yes | API password |
| `MINIMAX_ORG_ID` | No | Default organization ID |
| `MINIMAX_BASE_URL` | No | API base (default: `https://moj.minimax.hr/HR/API/api`) |

## Rate Limits

Minimax enforces per-organization limits: **1,000 calls/day**, **20,000 calls/month**. Use `get-rate-limit-status` to check usage.

## License

MIT
