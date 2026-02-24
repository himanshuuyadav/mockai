import { DashboardShell } from "@/components/dashboard/dashboard-shell";

type DashboardPageProps = {
  searchParams?: {
    billing?: string;
  };
};

export default function DashboardPage({ searchParams }: DashboardPageProps) {
  const rawStatus = searchParams?.billing;
  const billingStatus =
    rawStatus === "success" || rawStatus === "cancelled" ? rawStatus : undefined;

  return <DashboardShell billingStatus={billingStatus} />;
}
