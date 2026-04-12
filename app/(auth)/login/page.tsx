"use client";

import Link from "next/link";
import { useState, useTransition, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { loginSchema } from "@/lib/utils/validation";
import { generateSecureHeaders } from "@/lib/security/client";
import { TurnstileWidget } from "@/components/security/TurnstileCaptcha";
import { Lock, AlertTriangle, Hand } from "lucide-react";

interface TurnstileRef {
  reset: () => void
}

interface AuthErrorState {
  message: string;
}

interface AuthClient {
  auth: {
    signInWithPassword: (credentials: { 
      email: string; 
      password: string;
      options?: { captchaToken?: string };
    }) => Promise<{ error: Error | null }>;
    signInWithOAuth: (options: { provider: string; options: { redirectTo: string } }) => Promise<void>;
  };
}

export default function AuthLoginPage() {
  const router = useRouter();
  const [isPending] = useTransition();
  const [authError, setAuthError] = useState<AuthErrorState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lockoutMs, setLockoutMs] = useState<number>(0);
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const turnstileRef = useRef<TurnstileRef>(null);
  const { t, mounted } = useTranslation();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setAuthError(null);
    setLockoutMs(0);
    setIsSubmitting(true);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setAuthError({
        message: parsed.error.issues[0]?.message ?? "Invalid email or password",
      });
      setIsSubmitting(false);
      return;
    }

    void (async () => {
      try {
        // Step 1: Pre-check lockout
        const prePayload = { email, password };
        const preHeaders = await generateSecureHeaders(prePayload);
        const preCheck = await fetch("/api/auth/login", {
          method: "POST",
          headers: preHeaders,
          body: JSON.stringify(prePayload),
        });

        const preData: unknown = await preCheck.json();
        const preJson = preData as {
          error?: string;
          locked?: boolean;
          remainingMs?: number;
          proceed?: boolean;
        };

        if (!preCheck.ok) {
          setIsSubmitting(false);
          if (preJson.locked && preJson.remainingMs) {
            setLockoutMs(preJson.remainingMs);
          }
          setAuthError({
            message: preJson.error ?? "Failed to log in. Please try again.",
          });
          return;
        }

        // Step 2: Client-side Supabase sign in (sets session cookie)
        const supabase = createSupabaseBrowserClient() as AuthClient;
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: {
            captchaToken: captchaToken,
          },
        });

        // Debug logging - check browser console (F12) for actual error
        if (signInError) {
          console.error("[LOGIN] Supabase signIn error:", signInError.message, "Status:", (signInError as { status?: number }).status);
        }

        const success = !signInError;

        // Step 3: Record attempt result
        const putPayload = { email, success };
        const putHeaders = await generateSecureHeaders(putPayload);
        await fetch("/api/auth/login", {
          method: "PUT",
          headers: putHeaders,
          body: JSON.stringify(putPayload),
        });

        setIsSubmitting(false);

        if (!success) {
          // Reset Turnstile widget - tokens are one-time use only
          turnstileRef.current?.reset()
          setCaptchaToken("")
          setAuthError({
            message: "Invalid email or password. Please try again.",
          })
          return
        }

        // Step 4: Redirect on success
        window.location.href = "/dashboard"
      } catch {
        setIsSubmitting(false)
        setAuthError({
          message: "Network error. Please try again.",
        })
      }
    })();
  };

  const handleGoogleLogin = async () => {
    const supabase = createSupabaseBrowserClient() as AuthClient;
    const redirectTo = `${window.location.origin}/callback`;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  };

  const isLoading = isSubmitting;
  const error = authError?.message ?? null;

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
      {/* Navbar */}
      <nav className="h-16 px-4 lg:px-6 flex items-center justify-between bg-white border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[#00B9A7] flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-bold text-[#1A1A2E] text-base">SonaMoney</span>
        </Link>
        <Link href="/signup" className="text-sm font-semibold text-[#00B9A7] hover:text-[#0099A0] transition-colors">
          Sign up →
        </Link>
      </nav>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#E6F7F6] mb-4">
              <Hand className="w-6 h-6 text-[#00B9A7]" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#1A1A2E]">{mounted ? t("auth.welcomeBack") : "Welcome back"}</h1>
            <p className="text-sm text-[#6B7280] mt-1">{mounted ? t("auth.loginDescription") : "Log in to your SonaMoney account"}</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 lg:p-8 space-y-5">
            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-2">
                <div className="w-4 h-4 rounded-full border-2 border-[#00B9A7] border-t-transparent animate-spin"/>
                <span className="text-sm text-[#6B7280]">{mounted ? t("auth.signingIn") : "Signing you in..."}</span>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="rounded-2xl bg-[#FFF0F0] border border-[#FF5B5B]/20 px-4 py-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#FF5B5B]" />
                <p className="text-sm text-[#FF5B5B] font-medium">{error}</p>
              </div>
            )}

            {/* Lockout countdown */}
            {lockoutMs > 0 && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3">
                <p className="text-sm text-amber-700 font-medium">
                  <Lock className="w-4 h-4 inline" /> Account locked. Try again in{" "}
                  {Math.ceil(lockoutMs / 60000)} minute{Math.ceil(lockoutMs / 60000) !== 1 ? "s" : ""}.
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1A1A2E] uppercase tracking-wide block">{mounted ? t("auth.email") : "Email"}</label>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-[#1A1A2E] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#00B9A7]/30 focus:border-[#00B9A7] transition-all duration-200 bg-white"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1A1A2E] uppercase tracking-wide block">{mounted ? t("auth.password") : "Password"}</label>
                <input
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-[#1A1A2E] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#00B9A7]/30 focus:border-[#00B9A7] transition-all duration-200 bg-white"
                />
              </div>

              {/* CAPTCHA Widget */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1A1A2E] uppercase tracking-wide block">
                  Security Verification
                </label>
                <TurnstileWidget
                  widgetRef={turnstileRef}
                  onVerify={(token) => setCaptchaToken(token)}
                  onError={() => setAuthError({ message: "CAPTCHA verification failed. This may be due to browser privacy settings blocking third-party content. Try disabling 'Prevent Cross-Site Tracking' or use a different browser." })}
                  action="login"
                />
              </div>

              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#6B7280] hover:text-[#00B9A7] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !captchaToken}
                className="w-full h-11 bg-[#00B9A7] text-white rounded-full font-semibold text-sm hover:bg-[#0099A0] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#00B9A7]/25"
              >
                {isLoading ? (mounted ? t("auth.signingIn") : "Signing in...") : (mounted ? t("auth.login") : "Log in")}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100"/>
              <span className="text-xs text-[#6B7280] font-medium">{mounted ? t("auth.orContinueWith") : "or continue with"}</span>
              <div className="flex-1 h-px bg-gray-100"/>
            </div>

            {/* Google button */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full h-11 border border-gray-200 rounded-full font-semibold text-sm text-[#1A1A2E] flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all duration-200 disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {mounted ? t("auth.signInWithGoogle") : "Sign in with Google"}
            </button>
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-[#6B7280] mt-6">
            {mounted ? t("auth.dontHaveAccount") : "Don't have an account?"}{" "}
            <Link href="/signup" className="font-semibold text-[#00B9A7] hover:text-[#0099A0] transition-colors">
              {mounted ? t("auth.signUpFree") : "Sign up free"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}