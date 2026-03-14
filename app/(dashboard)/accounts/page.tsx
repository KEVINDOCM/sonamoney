// @ts-nocheck
import { Card } from "@/components/ui/Card";
import { getOrSeedAccounts } from "@/lib/actions/accounts";
import { getTransfers } from "@/lib/actions/transfers";
import { AccountsClient } from "@/components/accounts/AccountsClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AccountsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [accounts, transfers] = await Promise.all([
    getOrSeedAccounts(),
    getTransfers(),
  ]);

  return (
    <Card>
      <AccountsClient accounts={accounts} transfers={transfers} />
    </Card>
  );
}
