import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  const email = (user as any).email ?? "";
  const displayName = (user as any).user_metadata?.display_name ?? "";

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account preferences.</p>
      </div>
      <SettingsClient email={email} displayName={displayName} />
    </div>
  );
}
