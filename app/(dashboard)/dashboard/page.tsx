import { Suspense } from "react";
import { DashboardData } from "./DashboardData";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

// Use streaming with Suspense for progressive rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData />
    </Suspense>
  );
}