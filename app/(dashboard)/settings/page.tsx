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
    <div className="page-container p-4 lg:p-6 pb-24">
      <div className="mb-6">
        <h1 className="page-title">Settings</h1>
        <p className="section-subtitle">Manage your account preferences</p>
      </div>
      <SettingsClient email={email} displayName={displayName} />
    </div>
  );
}
