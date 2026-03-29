import { Card } from "@/components/ui/Card";
import { fetchTransactions } from "@/lib/actions/transactions";
import { fetchCategories } from "@/lib/actions/categories";
import { TransactionsView } from "@/components/transactions/TransactionsView";

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

  const [{ items, total, page, pageSize }, categories] = await Promise.all([
    fetchTransactions({ page: currentPage }),
    fetchCategories(),
  ]);

  return (
    <Card>
      <TransactionsView
        transactions={items}
        categories={categories}
        total={total}
        page={page}
        pageSize={pageSize}
      />
    </Card>
  );
}