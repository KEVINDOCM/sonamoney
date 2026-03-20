"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Link from "next/link";

interface SupabaseAuthClient {
  auth: {
    resetPasswordForEmail: (email: string, options: { redirectTo: string }) => Promise<{ error: { message: string } | null }>;
  };
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const { t, mounted } = useTranslation();

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient() as unknown as SupabaseAuthClient;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sonamoney.my.id";

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccess(true);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        {/* Back link */}
        <Link
          href="/login"
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {mounted ? t("auth.backToLogin") : "Back to login"}
        </Link>

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-lg bg-[#00B9A7] flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="font-bold text-gray-900">Money Tracer</span>
        </div>

        {success ? (
          /* Success State */
          <div className="flex flex-col items-center text-center py-4">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Check your email</h2>
            <p className="text-sm text-gray-500">
              We&apos;ve sent a password reset link to {email}
            </p>
          </div>
        ) : (
          /* Form */
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Forgot password?</h1>
            <p className="text-sm text-gray-500 mb-6">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide block mb-1.5">
                  {mounted ? t("auth.email") : "Email"}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00B9A7]/30 focus:border-[#00B9A7] transition-all duration-200 bg-white"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-rose-500">
                  <AlertCircle className="h-3.5 w-3.5" /> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full h-11 bg-[#00B9A7] hover:bg-[#0099A0] disabled:opacity-50 text-white font-semibold rounded-full transition-colors duration-200 shadow-md shadow-[#00B9A7]/25"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
