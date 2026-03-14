// @ts-nocheck
import { Card } from "@/components/ui/Card";
import { fetchTransactions } from "@/lib/actions/transactions";
import { fetchCategories } from "@/lib/actions/categories";
import { getOrSeedAccounts } from "@/lib/actions/accounts";
import { TransactionsClient } from "@/components/transactions/TransactionsClient";

interface TransactionsPageProps {
  // searchParams must be a Promise in Next.js 15
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  // Await searchParams before use
  const resolvedSearchParams = await searchParams;
  const currentPage = resolvedSearchParams?.page ? Number(resolvedSearchParams.page) || 1 : 1;

  const [{ items, total, page, pageSize }, categories, accounts] = await Promise.all([
    fetchTransactions({ page: currentPage }),
    fetchCategories(),
    getOrSeedAccounts(),
  ]);

  return (
    <Card>
      <TransactionsClient
        transactions={items}
        categories={categories}
        accounts={accounts}
        total={total}
        page={page}
        pageSize={pageSize}
      />
    </Card>
  );
}