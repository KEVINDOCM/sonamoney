/**
 * Email OTP Sending Module
 * Sends one-time passwords via email using Resend or fallback to console logging in dev
 */

import { Resend } from "resend"
import { generateOTP, type MFAChallenge, createMFAChallenge, recordOTPSendAttempt } from "./index"

// Email configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@sonamoney.com"
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "SonaMoney"

// Initialize Resend client if API key is available
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

export interface EmailOTPSendResult {
  success: boolean
  challengeId?: string
  error?: string
}

/**
 * Send Email OTP to user
 */
export async function sendEmailOTP(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string,
  deviceFingerprint?: string
): Promise<EmailOTPSendResult> {
  try {
    // Generate OTP
    const otp = generateOTP()

    // Create challenge record
    const challenge = await createMFAChallenge(
      userId,
      "email_otp",
      otp,
      deviceFingerprint,
      ipAddress
    )

    if (!challenge) {
      return { success: false, error: "Failed to create verification challenge" }
    }

    // Record attempt for rate limiting
    await recordOTPSendAttempt(userId, ipAddress, userAgent)

    // Send email
    const emailResult = await sendOTPEmail(email, otp)

    if (!emailResult.success) {
      return { success: false, error: emailResult.error }
    }

    return { success: true, challengeId: challenge.id }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    console.error("[EMAIL_OTP] Failed to send:", errorMessage)
    return { success: false, error: "Failed to send verification code" }
  }
}

interface SendResult {
  success: boolean
  error?: string
}

/**
 * Send OTP email using Resend or fallback
 */
async function sendOTPEmail(email: string, otp: string): Promise<SendResult> {
  // Development fallback - log to console
  if (process.env.NODE_ENV === "development" && !RESEND_API_KEY) {
    console.log("=".repeat(60))
    console.log(`[DEV MODE] OTP for ${email}: ${otp}`)
    console.log("=".repeat(60))
    return { success: true }
  }

  if (!resend) {
    return { success: false, error: "Email service not configured" }
  }

  try {
    const { error } = await resend.emails.send({
      from: `${APP_NAME} <${EMAIL_FROM}>`,
      to: email,
      subject: `Your verification code for ${APP_NAME}`,
      html: generateEmailTemplate(otp),
    })

    if (error) {
      console.error("[EMAIL_OTP] Resend error:", error)
      return { success: false, error: "Failed to send email" }
    }

    return { success: true }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    console.error("[EMAIL_OTP] Send error:", errorMessage)
    return { success: false, error: "Email service error" }
  }
}

/**
 * Generate HTML email template for OTP
 */
function generateEmailTemplate(otp: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f5f7fa;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 480px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
    }
    .logo {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #00B9A7, #00C48C);
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 20px;
    }
    .title {
      font-size: 24px;
      font-weight: 600;
      color: #1a1a2e;
      margin: 16px 0 8px;
    }
    .subtitle {
      color: #6b7280;
      font-size: 14px;
    }
    .code-container {
      background: #f8fafc;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
    }
    .code {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 4px;
      color: #1a1a2e;
      font-family: 'SF Mono', Monaco, monospace;
    }
    .expiry {
      color: #ef4444;
      font-size: 13px;
      margin-top: 12px;
    }
    .footer {
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
      margin-top: 24px;
    }
    .security-notice {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      margin-top: 20px;
      border-radius: 0 8px 8px 0;
      font-size: 13px;
      color: #92400e;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">S</div>
      <h1 class="title">Verification Code</h1>
      <p class="subtitle">Use this code to complete your sign in</p>
    </div>
    
    <div class="code-container">
      <div class="code">${otp}</div>
      <p class="expiry">⏱ Expires in 10 minutes</p>
    </div>
    
    <div class="security-notice">
      🔒 Didn't request this code? If you didn't attempt to sign in, please ignore this email and 
      consider changing your password if you suspect unauthorized access.
    </div>
    
    <div class="footer">
      <p>This is an automated message from ${APP_NAME}</p>
      <p>Please do not reply to this email</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
