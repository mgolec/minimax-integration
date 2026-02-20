import type { Command } from 'commander';
import chalk from 'chalk';
import type { MinimaxClient } from '@minimax-api/core';
import { formatCustomersTable } from '../formatters/table.js';
import { formatJson } from '../formatters/json.js';

export function registerCustomerCommands(parent: Command, getClient: () => MinimaxClient): void {
  const customer = parent.command('customer').description('Customer management');

  customer
    .command('list')
    .description('List customers')
    .option('--search <query>', 'Search string')
    .option('--page <number>', 'Page number', '1')
    .option('--page-size <number>', 'Page size', '50')
    .action(async (opts) => {
      try {
        const client = getClient();
        const orgId = client.requireOrgId(parent.opts().orgId ? Number(parent.opts().orgId) : undefined);
        const result = await client.customers.list(orgId, {
          searchString: opts.search,
          currentPage: Number(opts.page),
          pageSize: Number(opts.pageSize),
        });
        const format = parent.opts().format ?? 'table';
        if (format === 'json') {
          console.log(formatJson(result));
        } else {
          console.log(`\nShowing ${result.Rows.length} of ${result.TotalRows} customers (page ${result.CurrentPageNumber})\n`);
          console.log(formatCustomersTable(result.Rows));
        }
      } catch (err) {
        console.error(chalk.red(`Failed to list customers: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });

  customer
    .command('get')
    .description('Get customer details')
    .argument('<id>', 'Customer ID')
    .action(async (id: string) => {
      try {
        const client = getClient();
        const orgId = client.requireOrgId(parent.opts().orgId ? Number(parent.opts().orgId) : undefined);
        const result = await client.customers.get(orgId, Number(id));
        const format = parent.opts().format ?? 'table';
        if (format === 'json') {
          console.log(formatJson(result));
        } else {
          console.log(formatCustomersTable([result]));
        }
      } catch (err) {
        console.error(chalk.red(`Failed to get customer: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });

  customer
    .command('create')
    .description('Create a new customer')
    .requiredOption('--name <name>', 'Customer name')
    .option('--code <code>', 'Customer code')
    .option('--tax-number <tax>', 'Tax number')
    .option('--address <address>', 'Address')
    .option('--city <city>', 'City')
    .option('--postal-code <code>', 'Postal code')
    .option('--email <email>', 'Email address')
    .option('--phone <phone>', 'Phone number')
    .option('--iban <iban>', 'IBAN')
    .action(async (opts) => {
      try {
        const client = getClient();
        const orgId = client.requireOrgId(parent.opts().orgId ? Number(parent.opts().orgId) : undefined);
        const result = await client.customers.create(orgId, {
          Name: opts.name,
          Code: opts.code,
          TaxNumber: opts.taxNumber,
          Address: opts.address,
          City: opts.city,
          PostalCode: opts.postalCode,
          Email: opts.email,
          Phone: opts.phone,
          IBAN: opts.iban,
        });
        console.log(chalk.green(`Customer created with ID: ${chalk.bold(String(result.CustomerId))}`));
        const format = parent.opts().format ?? 'table';
        if (format === 'json') {
          console.log(formatJson(result));
        }
      } catch (err) {
        console.error(chalk.red(`Failed to create customer: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });

  customer
    .command('lookup')
    .description('Auto-create customer from tax registry')
    .argument('<taxNumber>', 'Tax number to look up')
    .action(async (taxNumber: string) => {
      try {
        const client = getClient();
        const orgId = client.requireOrgId(parent.opts().orgId ? Number(parent.opts().orgId) : undefined);
        const result = await client.customers.lookupByTaxNumber(orgId, taxNumber);
        console.log(chalk.green(`Customer created/found: ${chalk.bold(result.Name)} (ID: ${result.CustomerId})`));
        const format = parent.opts().format ?? 'table';
        if (format === 'json') {
          console.log(formatJson(result));
        } else {
          console.log(formatCustomersTable([result]));
        }
      } catch (err) {
        console.error(chalk.red(`Failed to lookup customer: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });
}
