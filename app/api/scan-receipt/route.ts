import { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { scanReceiptWithGemini } from "@/lib/services/gemini"

export async function POST(request: Request): Promise<Response> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
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

    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString("base64")

    const result = await scanReceiptWithGemini(base64, file.type)

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
