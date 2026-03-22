// ============================================
// ERROR MODULE - Industry-Standard Error Handling
// ============================================

// Core error classes
export {
  AppError,
  AuthError,
  ValidationError,
  DatabaseError,
  NetworkError,
  ExternalAPIError,
  BusinessLogicError,
  ConfigurationError,
  createAppError,
  isAuthError,
  isValidationError,
  isRetryableError,
  isDatabaseError,
  isNetworkError,
} from "./AppError";

export type {
  ErrorCategory,
  ErrorSeverity,
  ErrorContext,
  ErrorDetails,
} from "./AppError";

// Logging
export {
  errorLogger,
  logError,
  logInfo,
  logWarn,
  logGenericError,
} from "./logger";

export type { LogEntry } from "./logger";
