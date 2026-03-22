// ============================================
// INDUSTRY-STANDARD ERROR HANDLING SYSTEM
// ============================================
// Features:
// - Structured error hierarchy
// - Error codes with categories
// - Error IDs for tracking
// - Context preservation
// - User-friendly messages
// ============================================

export type ErrorCategory =
  | "AUTH"           // Authentication/Authorization
  | "VALIDATION"     // Input validation
  | "DATABASE"       // Database operations
  | "NETWORK"        // Network/HTTP errors
  | "EXTERNAL_API"   // Third-party API errors
  | "BUSINESS_LOGIC" // Application logic errors
  | "CONFIGURATION"  // App configuration errors
  | "UNKNOWN";       // Uncategorized errors

export type ErrorSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  path?: string;
  action?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorDetails {
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  context?: ErrorContext;
  cause?: Error;
  retryable: boolean;
  retryAfter?: number; // milliseconds
}

// ============================================
// BASE APPLICATION ERROR CLASS
// ============================================
export class AppError extends Error {
  readonly code: string;
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly userMessage: string;
  readonly context?: ErrorContext;
  readonly cause?: Error;
  readonly retryable: boolean;
  readonly retryAfter?: number;
  readonly errorId: string;

  constructor(details: ErrorDetails) {
    super(details.message);
    this.name = "AppError";
    this.code = details.code;
    this.category = details.category;
    this.severity = details.severity;
    this.userMessage = details.userMessage;
    this.context = details.context;
    this.cause = details.cause;
    this.retryable = details.retryable;
    this.retryAfter = details.retryAfter;
    this.errorId = this.generateErrorId();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  private generateErrorId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${this.category}_${timestamp}_${random}`.toUpperCase();
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      category: this.category,
      severity: this.severity,
      message: this.message,
      userMessage: this.userMessage,
      errorId: this.errorId,
      retryable: this.retryable,
      retryAfter: this.retryAfter,
      context: this.context,
      cause: this.cause?.message,
      stack: this.stack,
    };
  }
}

// ============================================
// SPECIFIC ERROR CLASSES
// ============================================

export class AuthError extends AppError {
  constructor(
    message: string,
    options: {
      code?: string;
      userMessage?: string;
      context?: ErrorContext;
      cause?: Error;
    } = {}
  ) {
    super({
      code: options.code ?? "AUTH_001",
      category: "AUTH",
      severity: "MEDIUM",
      message,
      userMessage: options.userMessage ?? "Authentication failed. Please sign in again.",
      context: options.context,
      cause: options.cause,
      retryable: false,
    });
    this.name = "AuthError";
  }
}

export class ValidationError extends AppError {
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    options: {
      code?: string;
      fieldErrors?: Record<string, string[]>;
      userMessage?: string;
      context?: ErrorContext;
    } = {}
  ) {
    super({
      code: options.code ?? "VAL_001",
      category: "VALIDATION",
      severity: "LOW",
      message,
      userMessage: options.userMessage ?? message,
      context: options.context,
      retryable: false,
    });
    this.name = "ValidationError";
    this.fieldErrors = options.fieldErrors;
  }
}

export class DatabaseError extends AppError {
  constructor(
    message: string,
    options: {
      code?: string;
      userMessage?: string;
      context?: ErrorContext;
      cause?: Error;
      retryable?: boolean;
    } = {}
  ) {
    super({
      code: options.code ?? "DB_001",
      category: "DATABASE",
      severity: "HIGH",
      message,
      userMessage: options.userMessage ?? "Database operation failed. Please try again.",
      context: options.context,
      cause: options.cause,
      retryable: options.retryable ?? true,
      retryAfter: 1000,
    });
    this.name = "DatabaseError";
  }
}

export class NetworkError extends AppError {
  constructor(
    message: string,
    options: {
      code?: string;
      userMessage?: string;
      context?: ErrorContext;
      cause?: Error;
      retryable?: boolean;
    } = {}
  ) {
    super({
      code: options.code ?? "NET_001",
      category: "NETWORK",
      severity: "MEDIUM",
      message,
      userMessage: options.userMessage ?? "Network connection failed. Please check your internet.",
      context: options.context,
      cause: options.cause,
      retryable: options.retryable ?? true,
      retryAfter: 2000,
    });
    this.name = "NetworkError";
  }
}

export class ExternalAPIError extends AppError {
  readonly service: string;
  readonly statusCode?: number;

  constructor(
    service: string,
    message: string,
    options: {
      code?: string;
      statusCode?: number;
      userMessage?: string;
      context?: ErrorContext;
      cause?: Error;
      retryable?: boolean;
    } = {}
  ) {
    super({
      code: options.code ?? "API_001",
      category: "EXTERNAL_API",
      severity: "HIGH",
      message: `[${service}] ${message}`,
      userMessage: options.userMessage ?? `${service} is temporarily unavailable. Please try again.`,
      context: options.context,
      cause: options.cause,
      retryable: options.retryable ?? (options.statusCode ? options.statusCode >= 500 : true),
      retryAfter: 3000,
    });
    this.name = "ExternalAPIError";
    this.service = service;
    this.statusCode = options.statusCode;
  }
}

export class BusinessLogicError extends AppError {
  constructor(
    message: string,
    options: {
      code?: string;
      userMessage?: string;
      context?: ErrorContext;
    } = {}
  ) {
    super({
      code: options.code ?? "BL_001",
      category: "BUSINESS_LOGIC",
      severity: "MEDIUM",
      message,
      userMessage: options.userMessage ?? message,
      context: options.context,
      retryable: false,
    });
    this.name = "BusinessLogicError";
  }
}

export class ConfigurationError extends AppError {
  constructor(
    message: string,
    options: {
      code?: string;
      context?: ErrorContext;
      cause?: Error;
    } = {}
  ) {
    super({
      code: options.code ?? "CFG_001",
      category: "CONFIGURATION",
      severity: "CRITICAL",
      message,
      userMessage: "System configuration error. Please contact support.",
      context: options.context,
      cause: options.cause,
      retryable: false,
    });
    this.name = "ConfigurationError";
  }
}

// ============================================
// ERROR FACTORY - Convert unknown errors to AppError
// ============================================
export function createAppError(
  error: unknown,
  context?: Partial<ErrorContext>
): AppError {
  if (error instanceof AppError) {
    return error;
  }

  const fullContext: ErrorContext = {
    timestamp: new Date().toISOString(),
    ...context,
  };

  // Handle standard Error
  if (error instanceof Error) {
    // Check for specific error patterns
    const message = error.message.toLowerCase();
    
    if (message.includes("supabase") || message.includes("postgresql")) {
      return new DatabaseError(error.message, { cause: error, context: fullContext });
    }
    
    if (message.includes("fetch") || message.includes("network") || message.includes("timeout")) {
      return new NetworkError(error.message, { cause: error, context: fullContext });
    }
    
    if (message.includes("auth") || message.includes("unauthorized") || message.includes("jwt")) {
      return new AuthError(error.message, { cause: error, context: fullContext });
    }

    return new AppError({
      code: "UNK_001",
      category: "UNKNOWN",
      severity: "MEDIUM",
      message: error.message,
      userMessage: "An unexpected error occurred. Please try again.",
      context: fullContext,
      cause: error,
      retryable: false,
    });
  }

  // Handle primitive errors
  return new AppError({
    code: "UNK_002",
    category: "UNKNOWN",
    severity: "MEDIUM",
    message: String(error),
    userMessage: "An unexpected error occurred. Please try again.",
    context: fullContext,
    retryable: false,
  });
}

// ============================================
// ERROR CHECKERS
// ============================================
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isRetryableError(error: unknown): boolean {
  return error instanceof AppError && error.retryable;
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}
