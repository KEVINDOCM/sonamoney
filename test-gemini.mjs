import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env.GEMINI_API_KEY

console.log("[TEST] API Key exists:", !!apiKey)
console.log("[TEST] API Key length:", apiKey?.length)
console.log("[TEST] API Key first 8 chars:", apiKey?.slice(0, 8))

if (!apiKey) {
  console.error("[TEST] No API key found!")
  process.exit(1)
}

const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

console.log("[TEST] Model initialized, sending test prompt...")

try {
  const result = await model.generateContent("Say hello in one word")
  console.log("[TEST] Success! Response:", result.response.text())
} catch (error) {
  console.error("[TEST] Error:", error instanceof Error ? error.message : String(error))
  console.error("[TEST] Full error:", error)
}
