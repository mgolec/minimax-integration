import { TokenManager } from './auth.js';
import { RateLimiter } from './rate-limiter.js';
import {
  MinimaxError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NotFoundError,
  ConcurrencyError,
} from './errors.js';

export interface HttpOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
  isMultipart?: boolean;
}

export class HttpClient {
  private baseUrl: string;
  private tokenManager: TokenManager;
  private rateLimiter: RateLimiter;
  private maxRetries = 3;

  constructor(baseUrl: string, tokenManager: TokenManager, rateLimiter: RateLimiter) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.tokenManager = tokenManager;
    this.rateLimiter = rateLimiter;
  }

  async get<T>(path: string, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>({ method: 'GET', query }, path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>({ method: 'POST', body }, path);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>({ method: 'PUT', body }, path);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>({ method: 'DELETE' }, path);
  }

  async uploadMultipart<T>(path: string, formData: FormData): Promise<T> {
    return this.request<T>({ method: 'POST', body: formData, isMultipart: true }, path);
  }

  private async request<T>(options: HttpOptions, path: string, attempt = 1): Promise<T> {
    if (!this.rateLimiter.canMakeCall()) {
      throw new RateLimitError('Local rate limit budget exhausted');
    }

    const token = await this.tokenManager.getToken();
    const url = this.buildUrl(path, options.query);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    if (!options.isMultipart && options.body) {
      headers['Content-Type'] = 'application/json';
    }

    const fetchOptions: RequestInit = {
      method: options.method ?? 'GET',
      headers,
    };

    if (options.body) {
      fetchOptions.body = options.isMultipart ? (options.body as FormData) : JSON.stringify(options.body);
    }

    let response: Response;
    try {
      response = await fetch(url, fetchOptions);
    } catch (err) {
      if (attempt < this.maxRetries) {
        await this.backoff(attempt);
        return this.request<T>(options, path, attempt + 1);
      }
      throw new MinimaxError(`Network error: ${(err as Error).message}`);
    }

    this.rateLimiter.recordCall();

    if (response.ok) {
      const text = await response.text();
      if (!text) return undefined as T;
      return JSON.parse(text) as T;
    }

    // Handle retryable errors
    if ((response.status === 429 || response.status >= 500) && attempt < this.maxRetries) {
      await this.backoff(attempt);
      return this.request<T>(options, path, attempt + 1);
    }

    // Map errors
    const errorBody = await response.text();
    switch (response.status) {
      case 401:
        this.tokenManager.clearToken();
        throw new AuthenticationError(errorBody || 'Unauthorized');
      case 404:
        throw new NotFoundError(errorBody || 'Not found');
      case 409:
        throw new ConcurrencyError(errorBody || 'Concurrency conflict');
      case 422: {
        let fields: Record<string, string[]> = {};
        try {
          const parsed = JSON.parse(errorBody);
          fields = parsed.errors ?? parsed;
        } catch { /* use empty fields */ }
        throw new ValidationError(errorBody, fields);
      }
      case 429:
        throw new RateLimitError(errorBody);
      default:
        throw new MinimaxError(`API error ${response.status}: ${errorBody}`, response.status);
    }
  }

  private buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private backoff(attempt: number): Promise<void> {
    const delay = Math.min(1000 * 2 ** (attempt - 1), 10000);
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}
