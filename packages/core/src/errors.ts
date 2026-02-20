export class MinimaxError extends Error {
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'MinimaxError';
    this.statusCode = statusCode;
  }
}

export class AuthenticationError extends MinimaxError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends MinimaxError {
  public readonly retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ValidationError extends MinimaxError {
  public readonly fields: Record<string, string[]>;

  constructor(message: string, fields: Record<string, string[]> = {}) {
    super(message, 422);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

export class NotFoundError extends MinimaxError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ConcurrencyError extends MinimaxError {
  constructor(message = 'RowVersion conflict - resource was modified by another request') {
    super(message, 409);
    this.name = 'ConcurrencyError';
  }
}
