import { ActionResult } from "@/lib/types/actions"

// Wrap async action with error handling
export async function withActionResult<T>(
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const data = await fn()
    return { success: true, data }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "An unexpected error occurred" }
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
