import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SettingsClient } from "@/components/settings/SettingsClient";

interface UserWithMetadata {
  email?: string;
  user_metadata?: {
    display_name?: string;
  };
}

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  const typedUser = user as UserWithMetadata;
  const email = typedUser.email ?? "";
  const displayName = typedUser.user_metadata?.display_name ?? "";

  return (
    <div className="bg-[#F5F7FA] dark:bg-[#0F172A] min-h-screen p-4 lg:p-6 pb-24">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-[#1A1A2E] dark:text-white">Settings</h1>
        <p className="text-xs text-[#6B7280] dark:text-gray-400">Manage your account preferences.</p>
      </div>
      <SettingsClient email={email} displayName={displayName} />
    </div>
  );
}
