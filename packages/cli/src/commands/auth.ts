import type { Command } from 'commander';
import chalk from 'chalk';
import type { MinimaxClient } from '@minimax-api/core';

export function registerAuthCommands(parent: Command, getClient: () => MinimaxClient): void {
  const auth = parent.command('auth').description('Authentication management');

  auth
    .command('login')
    .description('Authenticate with Minimax API')
    .action(async () => {
      try {
        const client = getClient();
        await client.authenticate();
        console.log(chalk.green('Successfully authenticated with Minimax API.'));
      } catch (err) {
        console.error(chalk.red(`Authentication failed: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });

  auth
    .command('status')
    .description('Show current authentication status')
    .action(async () => {
      try {
        const client = getClient();
        await client.authenticate();
        console.log(chalk.green('Authenticated - token is valid.'));
        if (client.defaultOrgId) {
          console.log(`Default organisation ID: ${chalk.bold(String(client.defaultOrgId))}`);
        }
      } catch (err) {
        console.error(chalk.red(`Not authenticated: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });

  auth
    .command('logout')
    .description('Clear saved credentials')
    .action(() => {
      try {
        const client = getClient();
        client.clearAuth();
        console.log(chalk.green('Credentials cleared.'));
      } catch (err) {
        console.error(chalk.red(`Failed to clear credentials: ${err instanceof Error ? err.message : String(err)}`));
        process.exitCode = 1;
      }
    });
}
