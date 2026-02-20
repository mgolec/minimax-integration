import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MinimaxClient } from '@minimax-api/core';
import { formatSuccess, formatError, formatTable } from '../helpers.js';

export function registerReferenceDataTools(server: McpServer, client: MinimaxClient) {
  server.tool(
    'list-items',
    'Lists items/products/services available for use in invoices and journals',
    {
      orgId: z.number().describe('Organization ID'),
      searchString: z.string().optional().describe('Search by name or code'),
      pageSize: z.number().optional().describe('Results per page (default 50)'),
      currentPage: z.number().optional().describe('Page number (default 1)'),
    },
    async ({ orgId, searchString, pageSize, currentPage }) => {
      try {
        const result = await client.items.list(orgId, { searchString, pageSize, currentPage });
        const header = `Items (${result.TotalRows} total, page ${result.CurrentPageNumber})\n`;
        const table = formatTable(
          result.Rows as unknown as Record<string, unknown>[],
          [
            { key: 'ItemId', label: 'ID', width: 8 },
            { key: 'Code', label: 'Code', width: 10 },
            { key: 'Name', label: 'Name', width: 30 },
            { key: 'Price', label: 'Price', width: 12 },
            { key: 'UnitOfMeasurement', label: 'Unit', width: 8 },
            { key: 'ItemType', label: 'Type', width: 10 },
          ],
        );
        return formatSuccess(header + table);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
