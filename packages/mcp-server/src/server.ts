import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { MinimaxClient } from '@minimax-api/core';
import { registerOrganisationTools } from './tools/organisation.js';
import { registerIssuedInvoiceTools } from './tools/issued-invoices.js';
import { registerReceivedInvoiceTools } from './tools/received-invoices.js';
import { registerInboxTools } from './tools/inbox.js';
import { registerJournalTools } from './tools/journals.js';
import { registerCustomerTools } from './tools/customers.js';
import { registerReferenceDataTools } from './tools/reference-data.js';

export function createServer(): { server: McpServer; client: MinimaxClient } {
  const client = new MinimaxClient();

  const server = new McpServer(
    { name: 'minimax', version: '1.0.0' },
    {
      capabilities: { tools: {} },
      instructions:
        'Minimax Accounting API server. Provides tools for managing organizations, invoices, customers, journals, inbox documents, and reference data in Minimax ERP.',
    },
  );

  registerOrganisationTools(server, client);
  registerIssuedInvoiceTools(server, client);
  registerReceivedInvoiceTools(server, client);
  registerInboxTools(server, client);
  registerJournalTools(server, client);
  registerCustomerTools(server, client);
  registerReferenceDataTools(server, client);

  return { server, client };
}
