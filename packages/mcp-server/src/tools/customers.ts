import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MinimaxClient } from '@minimax-api/core';
import { formatSuccess, formatError, formatTable } from '../helpers.js';

export function registerCustomerTools(server: McpServer, client: MinimaxClient) {
  server.tool(
    'list-customers',
    'Search and list customers/partners in an organization',
    {
      orgId: z.number().describe('Organization ID'),
      searchString: z.string().optional().describe('Search by name, tax number, or code'),
      pageSize: z.number().optional().describe('Results per page (default 50)'),
      currentPage: z.number().optional().describe('Page number (default 1)'),
    },
    async ({ orgId, searchString, pageSize, currentPage }) => {
      try {
        const result = await client.customers.list(orgId, { searchString, pageSize, currentPage });
        const header = `Customers (${result.TotalRows} total, page ${result.CurrentPageNumber})\n`;
        const table = formatTable(
          result.Rows as unknown as Record<string, unknown>[],
          [
            { key: 'CustomerId', label: 'ID', width: 8 },
            { key: 'Name', label: 'Name', width: 30 },
            { key: 'TaxNumber', label: 'Tax Number', width: 15 },
            { key: 'City', label: 'City', width: 15 },
            { key: 'Email', label: 'Email', width: 25 },
          ],
        );
        return formatSuccess(header + table);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  server.tool(
    'create-customer',
    'Creates a new customer/partner in the organization',
    {
      orgId: z.number().describe('Organization ID'),
      name: z.string().describe('Customer name'),
      taxNumber: z.string().optional().describe('Tax identification number'),
      registrationNumber: z.string().optional().describe('Registration number'),
      address: z.string().optional().describe('Street address'),
      city: z.string().optional().describe('City'),
      postalCode: z.string().optional().describe('Postal code'),
      country: z.object({ ID: z.number() }).optional().describe('Country reference'),
      email: z.string().optional().describe('Email address'),
      phone: z.string().optional().describe('Phone number'),
      iban: z.string().optional().describe('Bank account IBAN'),
      isCustomer: z.boolean().optional().describe('Mark as customer (default true)'),
      isSupplier: z.boolean().optional().describe('Mark as supplier'),
    },
    async ({ orgId, name, taxNumber, registrationNumber, address, city, postalCode, country, email, phone, iban, isCustomer, isSupplier }) => {
      try {
        const customer = await client.customers.create(orgId, {
          Name: name,
          TaxNumber: taxNumber,
          RegistrationNumber: registrationNumber,
          Address: address,
          City: city,
          PostalCode: postalCode,
          Country: country,
          Email: email,
          Phone: phone,
          IBAN: iban,
          IsCustomer: isCustomer,
          IsSupplier: isSupplier,
        });
        return formatSuccess(
          `Customer created successfully.\nID: ${customer.CustomerId}\nName: ${customer.Name}`,
        );
      } catch (error) {
        return formatError(error);
      }
    },
  );

  server.tool(
    'lookup-customer-by-tax',
    'Looks up and auto-creates a customer from the tax registry using their tax number. The API fills in name, address, and other details automatically.',
    {
      orgId: z.number().describe('Organization ID'),
      taxNumber: z.string().describe('Tax identification number to look up'),
    },
    async ({ orgId, taxNumber }) => {
      try {
        const customer = await client.customers.lookupByTaxNumber(orgId, taxNumber);
        return formatSuccess(
          `Customer created from tax registry.\nID: ${customer.CustomerId}\nName: ${customer.Name}\nTax Number: ${customer.TaxNumber ?? 'N/A'}\nAddress: ${customer.Address ?? 'N/A'}, ${customer.City ?? ''}`,
        );
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
