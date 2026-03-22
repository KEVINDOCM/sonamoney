import { ActionResult } from "@/lib/types/actions"
import { AppError, createAppError, logError } from "@/lib/errors"

// Wrap async action with industry-standard error handling
export async function withActionResult<T>(
  fn: () => Promise<T>,
  context?: { action?: string; userId?: string; path?: string }
): Promise<ActionResult<T>> {
  try {
    const data = await fn()
    return { success: true, data }
  } catch (error) {
    // Convert to AppError for consistent handling
    const appError = createAppError(error, {
      action: context?.action ?? "server_action",
      userId: context?.userId,
      path: context?.path,
      timestamp: new Date().toISOString(),
    })

    // Log the error
    logError(appError, {
      isServerAction: true,
      actionName: context?.action,
    })

    // Return user-friendly error message with error ID
    return { 
      success: false, 
      error: `${appError.userMessage} (Error ID: ${appError.errorId})`,
    }
  }
}

// Standard success result
export function successResult<T>(data?: T): ActionResult<T> {
  return { success: true, data }
}

// Standard error result
export function errorResult(error: string): ActionResult<never> {
  return { success: false, error }
}
