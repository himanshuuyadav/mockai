import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { z } from "zod";

type DashboardPageProps = {
  searchParams?: {
    billing?: string;
  };
};

const dashboardQuerySchema = z.object({
  billing: z.enum(["success", "cancelled"]).optional(),
});

export default function DashboardPage({ searchParams }: DashboardPageProps) {
  const parsed = dashboardQuerySchema.safeParse(searchParams ?? {});
  const billingStatus = parsed.success ? parsed.data.billing : undefined;

  return <DashboardShell billingStatus={billingStatus} />;
}
