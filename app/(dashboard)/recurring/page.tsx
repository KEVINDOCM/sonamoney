import { fetchRecurringTransactions } from "@/lib/actions/recurring";
import { RecurringClient } from "./RecurringClient";

export default async function RecurringPage() {
  const recurringTransactions = await fetchRecurringTransactions();

  return <RecurringClient initialRecurring={recurringTransactions} />;
}
