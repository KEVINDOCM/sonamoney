"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface SupabaseAuthClient {
  auth: {
    updateUser: (params: { password: string }) => Promise<{ error: { message: string } | null }>;
  };
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const { t, mounted } = useTranslation();

  async function handleResetPassword(): Promise<void> {
    setError("");
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    
    setLoading(true);
    const supabase = createSupabaseBrowserClient() as unknown as SupabaseAuthClient;
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    
    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
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
            <h2 className="text-base font-semibold text-gray-900 mb-1">Password updated</h2>
            <p className="text-sm text-gray-500">Redirecting you to dashboard...</p>
          </div>
        ) : (
          /* Form */
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Set new password</h1>
            <p className="text-sm text-gray-500 mb-6">
              Enter a new password for your account.
            </p>

            <div className="space-y-4 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  New password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-500 mb-4">
                <AlertCircle className="h-3.5 w-3.5" /> {error}
              </div>
            )}

            <button
              onClick={handleResetPassword}
              disabled={loading || !newPassword || !confirmPassword}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors duration-200"
            >
              {loading ? "Updating..." : "Update password"}
            </button>

            <p className="text-center text-xs text-gray-400 mt-4">
              <a href="/login" className="text-blue-600 hover:underline">{mounted ? t("auth.backToLogin") : "Back to login"}</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
