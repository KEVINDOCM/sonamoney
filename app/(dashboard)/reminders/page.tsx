import { getUpcomingBills } from "@/lib/actions/reminders";
import { RemindersClient } from "./RemindersClient";

export default async function RemindersPage() {
  const upcomingBills = await getUpcomingBills(30); // Get bills due in next 30 days

  return <RemindersClient initialBills={upcomingBills} />;
}
