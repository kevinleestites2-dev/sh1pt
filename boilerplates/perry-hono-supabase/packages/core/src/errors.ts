export class DomainError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(what: string) {
    super(`${what} not found`, 'not_found', 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'unauthorized') {
    super(message, 'unauthorized', 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'forbidden') {
    super(message, 'forbidden', 403);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, public details?: unknown) {
    super(message, 'validation_failed', 422);
    this.name = 'ValidationError';
  }
}
