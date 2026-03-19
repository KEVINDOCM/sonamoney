import { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { scanReceiptWithGemini } from "@/lib/services/gemini"

interface SupabaseAuthClient {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null } }>;
  };
}

const scanRateLimitMap = new Map<string, { count: number; resetAt: number }>()
const SCAN_RATE_LIMIT = 10
const SCAN_RATE_WINDOW_MS = 60 * 60 * 1000

function checkScanRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = scanRateLimitMap.get(userId)
  if (!entry || now > entry.resetAt) {
    scanRateLimitMap.set(userId, { count: 1, resetAt: now + SCAN_RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= SCAN_RATE_LIMIT) return false
  entry.count++
  return true
}

async function validateImageMagicBytes(buffer: ArrayBuffer): Promise<boolean> {
  const bytes = new Uint8Array(buffer.slice(0, 4))
  const jpeg = bytes[0] === 0xFF && bytes[1] === 0xD8
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47
  const webp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
  return jpeg || png || webp
}

export async function POST(request: Request): Promise<Response> {
  try {
    const supabase = await createSupabaseServerClient() as unknown as SupabaseAuthClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    if (!checkScanRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ error: "Too many scan requests. Max 10 per hour." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      )
    }

    const formData = await request.formData()
    const file = formData.get("image")

    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
    ]

    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: "Invalid file type. Use JPEG, PNG, or WebP." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: "File too large. Max 5MB." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const safeMimeType = ["image/jpeg", "image/png", "image/webp"].includes(file.type)
      ? file.type
      : "image/jpeg"

    const buffer = await file.arrayBuffer()

    const isValidImage = await validateImageMagicBytes(buffer)
    if (!isValidImage) {
      return new Response(
        JSON.stringify({ error: "Invalid image file." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const base64 = Buffer.from(buffer).toString("base64")

    const result = await scanReceiptWithGemini(base64, safeMimeType)

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Receipt scan error:", error)
    return new Response(
      JSON.stringify({ error: "Failed to scan receipt" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
