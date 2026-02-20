import type { Command } from 'commander';
import chalk from 'chalk';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { MinimaxClient } from '@minimax-api/core';
import { formatOrgsTable } from '../formatters/table.js';
import { formatJson } from '../formatters/json.js';

function getConfigPath(): string {
  return join(homedir(), '.minimax', 'config.json');
}

function loadConfigFile(): Record<string, unknown> {
  const configPath = getConfigPath();
  if (!existsSync(configPath)) return {};
  try {
    return JSON.parse(readFileSync(configPath, 'utf-8'));
  } catch {
    return {};
  }
}

export function registerOrgCommands(parent: Command, getClient: () => MinimaxClient): void {
  const org = parent.command('org').description('Organisation management');

  org
    .command('list')
    .description('List all accessible organisations')
    .action(async () => {
      try {
        const client = getClient();
        const orgs = await client.organisations.list();
        const format = parent.opts().format ?? 'table';
        if (format === 'json') {
          console.log(formatJson(orgs));
        } else {
          console.log(formatOrgsTable(orgs));
        }
      } catch (err) {
        console.error(chalk.red(`Failed to list organisations: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });

  org
    .command('get')
    .description('Get organisation details')
    .argument('<orgId>', 'Organisation ID')
    .action(async (orgId: string) => {
      try {
        const client = getClient();
        const result = await client.organisations.get(Number(orgId));
        const format = parent.opts().format ?? 'table';
        if (format === 'json') {
          console.log(formatJson(result));
        } else {
          console.log(formatOrgsTable([result]));
        }
      } catch (err) {
        console.error(chalk.red(`Failed to get organisation: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });

  org
    .command('set-default')
    .description('Save default organisation ID to config')
    .argument('<orgId>', 'Organisation ID to set as default')
    .action((orgId: string) => {
      try {
        const configDir = join(homedir(), '.minimax');
        mkdirSync(configDir, { recursive: true });
        const config = loadConfigFile();
        config.orgId = Number(orgId);
        writeFileSync(getConfigPath(), JSON.stringify(config, null, 2) + '\n');
        console.log(chalk.green(`Default organisation set to ${chalk.bold(orgId)}.`));
      } catch (err) {
        console.error(chalk.red(`Failed to set default org: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });
}
