import * as React from "react";
import { getOrSeedAccounts } from "@/lib/actions/accounts";
import { getTransfers } from "@/lib/actions/transfers";
import { AccountsClient } from "@/components/accounts/AccountsClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function AccountsSkeleton() {
  return (
    <div className="
      bg-[#F5F7FA] dark:bg-[#0F172A]
      min-h-screen pb-6
    ">
      {/* Header skeleton */}
      <div className="px-4 md:px-0 mb-4">
        <div className="skeleton h-7 w-32 rounded-xl mb-2"/>
        <div className="skeleton h-4 w-48 rounded-lg"/>
      </div>

      {/* Mobile cards skeleton */}
      <div className="
        flex gap-3 overflow-x-auto
        scrollbar-hide pb-2 px-4
        lg:hidden
      ">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="
              min-w-[200px] shrink-0
              rounded-2xl h-[130px]
              skeleton
            "
          />
        ))}
      </div>

      {/* Desktop grid skeleton */}
      <div className="
        hidden lg:grid
        lg:grid-cols-3 gap-4
      ">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl h-[160px] skeleton"
          />
        ))}
      </div>
    </div>
  );
}

export default async function AccountsPage() {
  return (
    <React.Suspense fallback={<AccountsSkeleton />}>
      <AccountsContent />
    </React.Suspense>
  );
}

async function AccountsContent() {
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
    <AccountsClient
      accounts={accounts}
      transfers={transfers}
    />
  );
}
