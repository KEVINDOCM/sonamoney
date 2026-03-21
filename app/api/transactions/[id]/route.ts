import { createSupabaseServerClient } from "@/lib/supabase/server"
import { logAuditEvent } from "@/lib/utils/auditLog"
import { validateRequest, getClientIp, whitelistFields, TransactionWhitelist } from "@/lib/security"
import { z } from "zod"

const MAX_AMOUNT = 999999999999

const updateTransactionSchema = z.object({
  category_id: z.string().uuid(),
  amount: z.number().positive().max(MAX_AMOUNT, "Amount too large"),
  type: z.enum(["income", "expense"]),
  date: z.string().min(1),
  notes: z.string().nullable().optional(),
  account_id: z.string().uuid().nullable().optional(),
})

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  // Extract id first so it's available in catch block
  const { id } = await params
  
  try {
    const ip = getClientIp(req)
    const body = await req.json()

    // STRICT WHITELISTING: Block any extra fields like 'role', 'is_admin'
    const whitelistedBody = whitelistFields(body, TransactionWhitelist.UPDATE, { strict: true })

    // Validate request (signature, timestamp, XSS, schema)
    const validation = await validateRequest(req, whitelistedBody, updateTransactionSchema)
    if (!validation.success) {
      const errorReason = validation.error ?? "validation_failed"
      await logAuditEvent({
        eventType: "transaction.update.blocked",
        eventStatus: "blocked",
        ipAddress: ip,
        metadata: { reason: errorReason, transaction_id: id },
      })
      return Response.json({ error: "Invalid request" }, { status: validation.status })
    }

    const data = validation.data!
    const supabase = await createSupabaseServerClient()

    // Get authenticated user
    const { data: userData, error: authError } = await (supabase as unknown as {
      auth: {
        getUser: () => Promise<{ data: { user: { id: string } | null }; error: Error | null }>
      }
    }).auth.getUser()
    if (authError || !userData.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = userData.user.id

    // Verify ownership before update (IDOR protection)
    const { data: existing, error: fetchError } = await (supabase as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (col: string, val: string) => {
            eq: (col2: string, val2: string) => {
              single: () => Promise<{ data: unknown | null; error: Error | null }>
            }
          }
        }
      }
    }).from("transactions")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (fetchError || !existing) {
      return Response.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Update with IDOR protection (user_id check)
    const { error } = await (supabase as unknown as {
      from: (table: string) => {
        update: (data: unknown) => {
          eq: (col: string, val: string) => {
            eq: (col2: string, val2: string) => Promise<{ error: Error | null }>
          }
        }
      }
    }).from("transactions")
      .update({
        category_id: data.category_id,
        amount: data.amount,
        type: data.type,
        date: data.date,
        notes: data.notes ?? null,
        account_id: data.account_id ?? null,
      })
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      await logAuditEvent({
        eventType: "transaction.update.failure",
        eventStatus: "failure",
        ipAddress: ip,
        metadata: { reason: error.message, transaction_id: id },
      })
      return Response.json({ error: "Failed to update transaction" }, { status: 500 })
    }

    await logAuditEvent({
      eventType: "transaction.update.success",
      eventStatus: "success",
      ipAddress: ip,
      metadata: { user_id: userId, transaction_id: id },
    })

    return Response.json({ success: true }, { status: 200 })
  } catch (err) {
    // Log mass assignment attempt
    if (err instanceof Error && err.message.includes("Forbidden fields")) {
      await logAuditEvent({
        eventType: "transaction.update.blocked",
        eventStatus: "blocked",
        ipAddress: getClientIp(req),
        metadata: { reason: "mass_assignment_attempt", details: err.message, transaction_id: id },
      })
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }
    return Response.json({ error: "An error occurred" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const ip = getClientIp(req)
    const { id } = await params

    // Validate request using dual-mode (Admin HMAC or User Session)
    // For DELETE, body is empty so we use requireTimestamp: true but skip schema validation
    const validation = await validateRequest(
      req,
      { id, action: "delete" },
      undefined,
      { requireTimestamp: true }
    )

    if (!validation.success) {
      const errorReason = validation.error ?? "validation_failed"
      await logAuditEvent({
        eventType: "transaction.delete.blocked",
        eventStatus: "blocked",
        ipAddress: ip,
        metadata: { reason: errorReason, transaction_id: id, mode: validation.mode ?? "unknown" },
      })
      return Response.json({ error: errorReason }, { status: validation.status })
    }

    const supabase = await createSupabaseServerClient()

    // Get authenticated user
    const { data: userData, error: authError } = await (supabase as unknown as {
      auth: {
        getUser: () => Promise<{ data: { user: { id: string } | null }; error: Error | null }>
      }
    }).auth.getUser()
    if (authError || !userData.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = userData.user.id

    // Verify ownership before delete (IDOR protection)
    const { data: existing, error: fetchError } = await (supabase as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (col: string, val: string) => {
            eq: (col2: string, val2: string) => {
              single: () => Promise<{ data: unknown | null; error: Error | null }>
            }
          }
        }
      }
    }).from("transactions")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (fetchError || !existing) {
      return Response.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Delete with IDOR protection (user_id check)
    const { error } = await (supabase as unknown as {
      from: (table: string) => {
        delete: () => {
          eq: (col: string, val: string) => {
            eq: (col2: string, val2: string) => Promise<{ error: Error | null }>
          }
        }
      }
    }).from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      await logAuditEvent({
        eventType: "transaction.delete.failure",
        eventStatus: "failure",
        ipAddress: ip,
        metadata: { reason: error.message, transaction_id: id },
      })
      return Response.json({ error: "Failed to delete transaction" }, { status: 500 })
    }

    await logAuditEvent({
      eventType: "transaction.delete.success",
      eventStatus: "success",
      ipAddress: ip,
      metadata: { user_id: userId, transaction_id: id },
    })

    return Response.json({ success: true }, { status: 200 })
  } catch {
    return Response.json({ error: "An error occurred" }, { status: 500 })
  }
}
