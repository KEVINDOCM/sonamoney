import { cookies } from "next/headers";

/**
 * Validates the maintenance mode environment variable
 * Returns validated boolean and logs warnings if needed
 */
function validateMaintenanceMode(): { isEnabled: boolean; error?: string } {
  const envValue = process.env.NEXT_PUBLIC_MAINTENANCE_MODE;
  
  // If not set, treat as disabled (default behavior)
  if (!envValue) {
    return { isEnabled: false };
  }
  
  // Validate it's a proper boolean string
  const trimmed = envValue.trim().toLowerCase();
  
  if (trimmed === "true") {
    return { isEnabled: true };
  }
  
  if (trimmed === "false") {
    return { isEnabled: false };
  }
  
  // Invalid value - log warning and treat as disabled
  console.warn(
    `[MAINTENANCE-BYPASS API] Invalid NEXT_PUBLIC_MAINTENANCE_MODE value: "${envValue}". ` +
    `Expected "true" or "false". Treating as "false".`
  );
  
  return { 
    isEnabled: false, 
    error: `Invalid environment variable value: ${envValue}` 
  };
}

/**
 * Maintenance Bypass API Route
 * Sets a secure HTTP-only cookie to bypass maintenance mode
 * This allows administrators to access the site during maintenance
 */
export async function POST(): Promise<Response> {
  try {
    // Validate maintenance mode environment variable
    const { isEnabled: isMaintenanceMode, error: validationError } = validateMaintenanceMode();
    
    // Only allow setting bypass if maintenance mode is actually enabled
    // This prevents accidental bypasses when not in maintenance
    if (!isMaintenanceMode) {
      return Response.json(
        { 
          error: "Maintenance mode is not active",
          details: process.env.NODE_ENV === "development" && validationError 
            ? validationError 
            : undefined
        },
        { status: 400 }
      );
    }

    // Validate NODE_ENV for secure cookie flag
    const isProduction = process.env.NODE_ENV === "production" || 
                         process.env.VERCEL_ENV === "production";

    // cookies() returns a Promise in Next.js 15+
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cookieStore = await cookies() as any;

    // Set the bypass cookie
    // - httpOnly: true - prevents JavaScript access
    // - secure: true - only sent over HTTPS in production
    // - sameSite: "lax" - CSRF protection
    // - maxAge: 24 hours - expires after 24 hours for security
    cookieStore.set("x-maintenance-bypass", "true", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours in seconds
      path: "/",
    });

    return Response.json(
      {
        success: true,
        message: "Maintenance bypass enabled",
        expiresIn: "24 hours",
        secure: isProduction,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[MAINTENANCE-BYPASS API] Error setting bypass cookie:", error);
    return Response.json(
      { 
        error: "Failed to set bypass cookie",
        details: process.env.NODE_ENV === "development" && error instanceof Error
          ? error.message
          : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Remove bypass cookie (for cleanup/logout)
 */
export async function DELETE(): Promise<Response> {
  try {
    // cookies() returns a Promise in Next.js 15+
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cookieStore = await cookies() as any;
    cookieStore.delete("x-maintenance-bypass");

    return Response.json(
      { success: true, message: "Maintenance bypass removed" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[MAINTENANCE-BYPASS API] Error removing bypass cookie:", error);
    return Response.json(
      { 
        error: "Failed to remove bypass cookie",
        details: process.env.NODE_ENV === "development" && error instanceof Error
          ? error.message
          : undefined
      },
      { status: 500 }
    );
  }
}
