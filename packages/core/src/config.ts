import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export interface MinimaxConfig {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  orgId?: number;
  baseUrl: string;
  authUrl: string;
}

const DEFAULT_BASE_URL = 'https://moj.minimax.hr/HR/api';
const DEFAULT_AUTH_URL = 'https://moj.minimax.hr/HR/AUT/oauth20/token';

function loadDotEnv(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) return {};
  const content = readFileSync(filePath, 'utf-8');
  const vars: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function loadConfigFile(): Partial<MinimaxConfig> {
  const configPath = join(homedir(), '.minimax', 'config.json');
  if (!existsSync(configPath)) return {};
  try {
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export function resolveConfig(explicit?: Partial<MinimaxConfig>): MinimaxConfig {
  const dotEnv = loadDotEnv(join(process.cwd(), '.env'));
  const fileConfig = loadConfigFile();

  const env = (key: string): string | undefined =>
    process.env[key] ?? dotEnv[key];

  const clientId = explicit?.clientId ?? env('MINIMAX_CLIENT_ID') ?? fileConfig.clientId;
  const clientSecret = explicit?.clientSecret ?? env('MINIMAX_CLIENT_SECRET') ?? fileConfig.clientSecret;
  const username = explicit?.username ?? env('MINIMAX_USERNAME') ?? fileConfig.username;
  const password = explicit?.password ?? env('MINIMAX_PASSWORD') ?? fileConfig.password;

  if (!clientId) throw new Error('MINIMAX_CLIENT_ID is required');
  if (!clientSecret) throw new Error('MINIMAX_CLIENT_SECRET is required');
  if (!username) throw new Error('MINIMAX_USERNAME is required');
  if (!password) throw new Error('MINIMAX_PASSWORD is required');

  const orgIdRaw = explicit?.orgId ?? env('MINIMAX_ORG_ID') ?? fileConfig.orgId;
  const orgId = orgIdRaw ? Number(orgIdRaw) : undefined;

  return {
    clientId,
    clientSecret,
    username,
    password,
    orgId,
    baseUrl: explicit?.baseUrl ?? env('MINIMAX_BASE_URL') ?? fileConfig.baseUrl ?? DEFAULT_BASE_URL,
    authUrl: explicit?.authUrl ?? env('MINIMAX_AUTH_URL') ?? fileConfig.authUrl ?? DEFAULT_AUTH_URL,
  };
}
