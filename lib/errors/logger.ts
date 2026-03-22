// ============================================
// ERROR LOGGING SERVICE
// Industry-standard logging with error tracking
// ============================================

import { AppError, ErrorContext, ErrorSeverity } from "@/lib/errors/AppError";

export interface LogEntry {
  level: "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";
  message: string;
  timestamp: string;
  errorId?: string;
  context?: ErrorContext;
  metadata?: Record<string, unknown>;
}

// Error severity to log level mapping
const severityToLevel: Record<ErrorSeverity, LogEntry["level"]> = {
  LOW: "WARN",
  MEDIUM: "ERROR",
  HIGH: "ERROR",
  CRITICAL: "FATAL",
};

class ErrorLogger {
  private buffer: LogEntry[] = [];
  private readonly bufferSize = 100;
  private flushInterval: NodeJS.Timeout | null = null;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
    this.startFlushInterval();
  }

  /**
   * Log an application error with full context
   */
  logError(error: AppError, metadata?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level: severityToLevel[error.severity],
      message: error.message,
      timestamp: new Date().toISOString(),
      errorId: error.errorId,
      context: error.context,
      metadata: {
        ...metadata,
        category: error.category,
        code: error.code,
        retryable: error.retryable,
        stack: error.stack,
        cause: error.cause?.message,
      },
    };

    this.addToBuffer(entry);

    // Always log errors immediately in development
    if (this.isDevelopment) {
      this.outputToConsole(entry, error);
    }

    // Send to external service in production
    if (!this.isDevelopment) {
      this.sendToExternalService(entry);
    }
  }

  /**
   * Log a generic error (non-AppError)
   */
  logGenericError(
    error: Error,
    level: LogEntry["level"] = "ERROR",
    metadata?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      level,
      message: error.message,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        name: error.name,
        stack: error.stack,
      },
    };

    this.addToBuffer(entry);

    if (this.isDevelopment) {
      console.error(`[${entry.level}] ${entry.message}`, error);
    }
  }

  /**
   * Log an informational message
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.addToBuffer({
      level: "INFO",
      message,
      timestamp: new Date().toISOString(),
      metadata,
    });

    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, metadata);
    }
  }

  /**
   * Log a warning
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.addToBuffer({
      level: "WARN",
      message,
      timestamp: new Date().toISOString(),
      metadata,
    });

    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, metadata);
    }
  }

  /**
   * Create a user-friendly error report for support
   */
  createSupportReport(errorId: string): string {
    const entries = this.buffer.filter((e) => e.errorId === errorId);
    
    return `
Error Report (${errorId})
====================
Time: ${new Date().toISOString()}
User Agent: ${typeof navigator !== "undefined" ? navigator.userAgent : "N/A"}
URL: ${typeof window !== "undefined" ? window.location.href : "N/A"}

Recent Logs:
${entries.map((e) => `[${e.timestamp}] ${e.level}: ${e.message}`).join("\n")}
    `.trim();
  }

  /**
   * Get buffered logs for debugging
   */
  getBuffer(): LogEntry[] {
    return [...this.buffer];
  }

  /**
   * Clear the log buffer
   */
  clearBuffer(): void {
    this.buffer = [];
  }

  private addToBuffer(entry: LogEntry): void {
    this.buffer.push(entry);
    
    // Keep buffer size manageable
    if (this.buffer.length > this.bufferSize) {
      this.buffer = this.buffer.slice(-this.bufferSize);
    }
  }

  private outputToConsole(entry: LogEntry, error?: AppError): void {
    const styles = {
      FATAL: "color: #DC2626; font-weight: bold;",
      ERROR: "color: #EF4444;",
      WARN: "color: #F59E0B;",
      INFO: "color: #3B82F6;",
      DEBUG: "color: #6B7280;",
    };

    console.group(`%c[${entry.level}] ${entry.message}`, styles[entry.level]);
    
    if (error) {
      console.log("Error ID:", error.errorId);
      console.log("Category:", error.category);
      console.log("Code:", error.code);
      console.log("User Message:", error.userMessage);
    }
    
    if (entry.metadata) {
      console.log("Metadata:", entry.metadata);
    }
    
    if (entry.context) {
      console.log("Context:", entry.context);
    }
    
    console.groupEnd();
  }

  private sendToExternalService(entry: LogEntry): void {
    // TODO: Integrate with external error tracking service
    // Examples: Sentry, LogRocket, DataDog, etc.
    
    // Example Sentry integration (commented out until Sentry is installed):
    /*
    if (typeof Sentry !== "undefined") {
      Sentry.captureMessage(entry.message, {
        level: entry.level.toLowerCase() as Sentry.Severity,
        extra: {
          ...entry.metadata,
          errorId: entry.errorId,
        },
        tags: {
          errorId: entry.errorId,
        },
      });
    }
    */

    // Send to your own logging endpoint
    this.sendToLoggingEndpoint(entry);
  }

  private async sendToLoggingEndpoint(entry: LogEntry): Promise<void> {
    // Only send in production and if endpoint is configured
    if (this.isDevelopment) return;
    
    const endpoint = process.env.NEXT_PUBLIC_LOGGING_ENDPOINT;
    if (!endpoint) return;

    try {
      // Use sendBeacon for reliable delivery during page unload
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(entry)], { type: "application/json" });
        navigator.sendBeacon(endpoint, blob);
      } else {
        // Fallback to fetch
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry),
          keepalive: true,
        });
      }
    } catch {
      // Silently fail - don't cause infinite error loops
    }
  }

  private startFlushInterval(): void {
    // Flush buffer every 30 seconds in production
    if (!this.isDevelopment && typeof window !== "undefined") {
      this.flushInterval = setInterval(() => {
        if (this.buffer.length > 0) {
          // Batch send logs
          this.flushBuffer();
        }
      }, 30000);
    }
  }

  private async flushBuffer(): Promise<void> {
    if (this.buffer.length === 0) return;
    
    const endpoint = process.env.NEXT_PUBLIC_LOGGING_ENDPOINT;
    if (!endpoint) return;

    const logs = [...this.buffer];
    this.buffer = [];

    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs }),
        keepalive: true,
      });
    } catch {
      // Restore logs to buffer on failure
      this.buffer.unshift(...logs);
    }
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

// Helper functions for common logging patterns
export function logError(error: AppError, metadata?: Record<string, unknown>): void {
  errorLogger.logError(error, metadata);
}

export function logInfo(message: string, metadata?: Record<string, unknown>): void {
  errorLogger.info(message, metadata);
}

export function logWarn(message: string, metadata?: Record<string, unknown>): void {
  errorLogger.warn(message, metadata);
}

export function logGenericError(
  error: Error,
  metadata?: Record<string, unknown>
): void {
  errorLogger.logGenericError(error, "ERROR", metadata);
}
