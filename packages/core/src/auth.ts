import { AuthenticationError } from './errors.js';
import type { MinimaxConfig } from './config.js';

interface TokenData {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export class TokenManager {
  private accessToken: string | null = null;
  private refreshTokenValue: string | null = null;
  private expiresAt = 0;
  private config: MinimaxConfig;

  constructor(config: MinimaxConfig) {
    this.config = config;
  }

  async getToken(): Promise<string> {
    if (this.isTokenValid()) {
      return this.accessToken!;
    }

    if (this.refreshTokenValue) {
      try {
        return await this.refreshToken();
      } catch {
        // Refresh failed, do full auth
      }
    }

    return await this.authenticate();
  }

  isTokenValid(): boolean {
    if (!this.accessToken) return false;
    // Refresh 60s before expiry
    return Date.now() < this.expiresAt - 60_000;
  }

  async authenticate(): Promise<string> {
    const body = new URLSearchParams({
      grant_type: 'password',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      username: this.config.username,
      password: this.config.password,
      scope: 'minimax.si',
    });

    const response = await fetch(this.config.authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new AuthenticationError(`OAuth2 token request failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as TokenData;
    this.setToken(data);
    return this.accessToken!;
  }

  async refreshToken(): Promise<string> {
    if (!this.refreshTokenValue) {
      throw new AuthenticationError('No refresh token available');
    }

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: this.refreshTokenValue,
    });

    const response = await fetch(this.config.authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      this.refreshTokenValue = null;
      throw new AuthenticationError('Token refresh failed');
    }

    const data = (await response.json()) as TokenData;
    this.setToken(data);
    return this.accessToken!;
  }

  private setToken(data: TokenData): void {
    this.accessToken = data.access_token;
    this.refreshTokenValue = data.refresh_token ?? null;
    this.expiresAt = Date.now() + data.expires_in * 1000;
  }

  clearToken(): void {
    this.accessToken = null;
    this.refreshTokenValue = null;
    this.expiresAt = 0;
  }
}
