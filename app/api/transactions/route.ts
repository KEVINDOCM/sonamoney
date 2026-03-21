import { createSupabaseServerClient } from "@/lib/supabase/server"
import { logAuditEvent } from "@/lib/utils/auditLog"
import { validateRequest, getClientIp } from "@/lib/security"
import { z } from "zod"

const MAX_AMOUNT = 999999999999

const createTransactionSchema = z.object({
  category_id: z.string().uuid("Invalid category ID"),
  amount: z.number().positive("Amount must be positive").max(MAX_AMOUNT, "Amount too large"),
  type: z.enum(["income", "expense"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  notes: z.string().max(500).nullable().optional(),
  account_id: z.string().uuid().nullable().optional(),
  is_recurring: z.boolean().default(false),
  recurring_interval: z.number().int().positive().nullable().optional(),
  recurring_unit: z.enum(["day", "week", "month"]).nullable().optional(),
  recurring_next_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
})

// Type for Supabase client with proper auth and from methods
interface SupabaseClient {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null }; error: Error | null }>
  }
  from: (table: string) => {
    insert: (data: unknown) => Promise<{ error: Error | null }>
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const ip = getClientIp(req)
    const body = await req.json()

    // Validate request (signature, timestamp, XSS, schema)
    const validation = await validateRequest(req, body, createTransactionSchema)
    if (!validation.success) {
      const errorReason = validation.error ?? "validation_failed"
      await logAuditEvent({
        eventType: "transaction.create.blocked",
        eventStatus: "blocked",
        ipAddress: ip,
        metadata: { reason: errorReason },
      })
      return Response.json({ error: "Invalid request" }, { status: validation.status })
    }

    const data = validation.data!
    const supabase = await createSupabaseServerClient() as unknown as SupabaseClient

    // Get authenticated user
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = userData.user.id

    // Create transaction with user_id
    const { error } = await supabase.from("transactions").insert({
      user_id: userId,
      category_id: data.category_id,
      amount: data.amount,
      type: data.type,
      date: data.date,
      notes: data.notes ?? null,
      account_id: data.account_id ?? null,
      is_recurring: data.is_recurring,
      recurring_interval: data.is_recurring ? data.recurring_interval ?? 1 : null,
      recurring_unit: data.is_recurring ? data.recurring_unit ?? "month" : null,
      recurring_next_date: data.is_recurring ? data.recurring_next_date ?? null : null,
    })

    if (error) {
      await logAuditEvent({
        eventType: "transaction.create.failure",
        eventStatus: "failure",
        ipAddress: ip,
        metadata: { reason: error.message },
      })
      return Response.json({ error: "Failed to create transaction" }, { status: 500 })
    }

    await logAuditEvent({
      eventType: "transaction.create.success",
      eventStatus: "success",
      ipAddress: ip,
      metadata: { user_id: userId, amount: Number(data.amount), type: String(data.type) },
    })

    return Response.json({ success: true }, { status: 201 })
  } catch {
    return Response.json({ error: "An error occurred" }, { status: 500 })
  }
}
