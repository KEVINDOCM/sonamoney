// ============================================
// RETRY LOGIC WITH EXPONENTIAL BACKOFF
// Industry-standard retry pattern
// ============================================

export interface RetryOptions {
  maxAttempts?: number;        // Maximum number of retry attempts (default: 3)
  initialDelay?: number;       // Initial delay in ms (default: 1000)
  maxDelay?: number;           // Maximum delay in ms (default: 30000)
  backoffMultiplier?: number;  // Exponential multiplier (default: 2)
  retryable?: (error: Error) => boolean; // Custom retry predicate
  onRetry?: (error: Error, attempt: number, nextDelay: number) => void; // Callback
}

export class RetryError extends Error {
  constructor(
    message: string,
    readonly attempts: number,
    readonly lastError: Error
  ) {
    super(message);
    this.name = "RetryError";
  }
}

/**
 * Retry a function with exponential backoff
 * Industry standard pattern used by AWS SDK, Stripe, etc.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    retryable = () => true,
    onRetry,
  } = options;

  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        break;
      }

      // Check if error is retryable
      if (!retryable(lastError)) {
        throw lastError;
      }

      // Calculate next delay with exponential backoff and jitter
      const jitter = Math.random() * 100; // Add 0-100ms jitter
      const nextDelay = Math.min(delay + jitter, maxDelay);

      // Call retry callback if provided
      onRetry?.(lastError, attempt, nextDelay);

      // Wait before retrying
      await sleep(nextDelay);

      // Increase delay for next attempt
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw new RetryError(
    `Failed after ${maxAttempts} attempts: ${lastError?.message}`,
    maxAttempts,
    lastError!
  );
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry configuration presets for common scenarios
 */
export const RetryPresets = {
  // For database operations - quick retries
  database: {
    maxAttempts: 3,
    initialDelay: 100,
    maxDelay: 2000,
    backoffMultiplier: 2,
  } as RetryOptions,

  // For network requests - longer delays
  network: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  } as RetryOptions,

  // For external APIs - aggressive retries
  externalAPI: {
    maxAttempts: 5,
    initialDelay: 2000,
    maxDelay: 60000,
    backoffMultiplier: 2,
  } as RetryOptions,

  // For critical operations - many attempts
  critical: {
    maxAttempts: 10,
    initialDelay: 500,
    maxDelay: 30000,
    backoffMultiplier: 1.5,
  } as RetryOptions,
};

// ============================================
// CIRCUIT BREAKER PATTERN
// Prevents cascading failures in distributed systems
// ============================================

type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  failureThreshold?: number;    // Failures before opening (default: 5)
  resetTimeout?: number;        // Time before trying again in ms (default: 30000)
  halfOpenMaxCalls?: number;    // Max calls in half-open state (default: 3)
}

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failures = 0;
  private nextAttempt = Date.now();
  private halfOpenCalls = 0;

  constructor(
    private readonly action: () => Promise<unknown>,
    private readonly options: CircuitBreakerOptions = {}
  ) {
    this.options = {
      failureThreshold: 5,
      resetTimeout: 30000,
      halfOpenMaxCalls: 3,
      ...options,
    };
  }

  async execute<T>(): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttempt) {
        throw new Error(
          `Circuit breaker is OPEN. Try again after ${new Date(this.nextAttempt).toISOString()}`
        );
      }
      this.state = "HALF_OPEN";
      this.halfOpenCalls = 0;
    }

    try {
      const result = await this.action();
      this.onSuccess();
      return result as T;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    if (this.state === "HALF_OPEN") {
      this.halfOpenCalls++;
      if (this.halfOpenCalls >= (this.options.halfOpenMaxCalls ?? 3)) {
        this.state = "CLOSED";
        this.halfOpenCalls = 0;
      }
    } else {
      this.state = "CLOSED";
    }
  }

  private onFailure(): void {
    this.failures++;
    
    if (this.state === "HALF_OPEN" || this.failures >= (this.options.failureThreshold ?? 5)) {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + (this.options.resetTimeout ?? 30000);
      this.halfOpenCalls = 0;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  isOpen(): boolean {
    return this.state === "OPEN" && Date.now() < this.nextAttempt;
  }
}

// Circuit breaker registry for managing multiple breakers
const circuitBreakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(
  name: string,
  action: () => Promise<unknown>,
  options?: CircuitBreakerOptions
): CircuitBreaker {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, new CircuitBreaker(action, options));
  }
  return circuitBreakers.get(name)!;
}
