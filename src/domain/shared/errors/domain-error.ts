/**
 * Base Domain Error class representing business rule violations.
 * All domain errors inherit from this class to provide unified error handling.
 */
export abstract class DomainError extends Error {
  public abstract readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends DomainError {
  public readonly code = 'VALIDATION_ERROR';
  constructor(message: string, public readonly details?: Record<string, string[]>) {
    super(message, 422);
  }
}

export class NotFoundError extends DomainError {
  public readonly code = 'NOT_FOUND';
  constructor(resource: string, identifier?: string | number) {
    const detail = identifier !== undefined ? ` with identifier '${identifier}'` : '';
    super(`${resource}${detail} was not found`, 404);
  }
}

export class ConflictError extends DomainError {
  public readonly code = 'CONFLICT';
  constructor(message: string) {
    super(message, 409);
  }
}

export class UnauthorizedError extends DomainError {
  public readonly code = 'UNAUTHORIZED';
  constructor(message: string = 'Authentication is required to perform this action') {
    super(message, 401);
  }
}

export class ForbiddenError extends DomainError {
  public readonly code = 'FORBIDDEN';
  constructor(message: string = 'You do not have permission to perform this action') {
    super(message, 403);
  }
}
