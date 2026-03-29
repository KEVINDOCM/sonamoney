/**
 * CSP Violation Reporting Endpoint - Simplified
 */

import { type NextRequest } from "next/server"

// Simple JSON response helper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = await (request as any).json()
    const cspReport = body?.["csp-report"]

    if (!cspReport) {
      return json({ error: "Invalid format" }, 400)
    }

    // Log the violation
    console.warn("[CSP]", {
      uri: cspReport["document-uri"],
      directive: cspReport["violated-directive"],
      blocked: cspReport["blocked-uri"],
    })

    // Store in database (commented until table exists)
    // const supabase = await createSupabaseServerClient() as any
    // await supabase.from("csp_violations").insert({...})

    return json({ received: true })
  } catch (err) {
    console.error("[CSP] Error:", err)
    return json({ error: "Failed" }, 500)
  }
}

export async function GET() {
  return json({ message: "CSP endpoint active" })
}
