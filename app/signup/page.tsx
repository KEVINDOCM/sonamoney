"use client";

import { useState, useTransition, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
// FIX: Updated import name
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface AuthErrorState {
  message: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [authError, setAuthError] = useState<AuthErrorState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { t, mounted } = useTranslation();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setAuthError(null);
    setIsSubmitting(true);

    // FIX: Updated to correct client function
    const supabase = createSupabaseBrowserClient();

    void (async () => {
      // Use type casting to avoid "Property 'signUp' does not exist"
      const { error } = await (supabase as any).auth.signUp({ email, password });

      setIsSubmitting(false);

      if (error) {
        setAuthError({
          message: mounted ? t("auth.signupError") : "Failed to sign up. Please try again.",
        });
        return;
      }

      startTransition(() => {
        router.push("/dashboard");
      });
    })();
  };

  const isLoading = isSubmitting || isPending;

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Card title={mounted ? t("auth.signup") : "Sign up"} description={mounted ? t("auth.signupDescription") : "Create your SonaMoney account."}>
          {isLoading && <Spinner label={mounted ? t("auth.creatingAccount") : "Creating your account..."} />}
          {!isLoading && authError && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {authError.message}
            </div>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input label={mounted ? t("auth.email") : "Email"} name="email" type="email" autoComplete="email" required />
            <Input label={mounted ? t("auth.password") : "Password"} name="password" type="password" autoComplete="new-password" required />
            <Button type="submit" className="w-full" isLoading={isLoading}>{mounted ? t("auth.signup") : "Sign up"}</Button>
          </form>
        </Card>
      </div>
    </main>
  );
}