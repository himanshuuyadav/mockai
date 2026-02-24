import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { BillingStatusBanner } from "@/components/dashboard/billing-status-banner";
import { PerformanceTrendChart } from "@/components/dashboard/performance-trend-chart";
import { CleanButton } from "@/components/ui/clean-button";
import { DashboardGrid } from "@/components/ui/dashboard-grid";
import { DataPanel } from "@/components/ui/data-panel";
import { MetricCard } from "@/components/ui/metric-card";
import { PageContainer } from "@/components/ui/page-container";
import { SectionHeader } from "@/components/ui/section-header";
import { SectionLayout } from "@/components/ui/section-layout";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/services/dashboard.service";
import { findUserProfileById, syncMonthlyInterviewAllowance } from "@/services/user.service";

export async function DashboardShell({
  billingStatus,
}: {
  billingStatus?: "success" | "cancelled";
}) {
  const session = await auth();
  if (session?.user?.id) {
    await syncMonthlyInterviewAllowance(session.user.id);
  }
  const data = session?.user?.id ? await getDashboardData(session.user.id) : null;
  const profile = session?.user?.id ? await findUserProfileById(session.user.id) : null;
  const usagePercent = Math.min(100, Math.round(((data?.endedSessions ?? 0) / Math.max(1, data?.totalSessions ?? 1)) * 100));

  return (
    <PageContainer className="space-y-8 pt-10">
      {billingStatus ? <BillingStatusBanner status={billingStatus} /> : null}

      <header className="panel flex flex-wrap items-center justify-between gap-4 p-5">
        <SectionHeader
          eyebrow="Dashboard"
          title={`Welcome back${session?.user?.name ? `, ${session.user.name}` : ""}`}
          description="Monitor interview performance, usage analytics, and recent activity."
        />
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="h-10 w-56 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400"
            placeholder="Search sessions..."
            type="text"
          />
          <CleanButton asChild>
            <Link href="/interview">Start Interview</Link>
          </CleanButton>
          <CleanButton asChild variant="outline">
            <Link href="/pricing">Upgrade</Link>
          </CleanButton>
          <LogoutButton />
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        Plan: <span className="font-semibold capitalize">{profile?.subscriptionTier ?? session?.user?.subscriptionTier ?? "free"}</span> |{" "}
        Interviews remaining this month:{" "}
        <span className="font-semibold">
          {(profile?.subscriptionTier ?? session?.user?.subscriptionTier ?? "free") === "pro"
            ? "Unlimited"
            : (profile?.interviewsRemaining ?? session?.user?.interviewsRemaining ?? 0)}
        </span>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
        <SectionHeader
          eyebrow="KPI Row"
          title="Session metrics"
          description="Real-time usage and performance indicators from your interview workspace."
        />
        <DashboardGrid>
          <MetricCard delta="All rounds" label="Total Sessions" value={`${data?.totalSessions ?? 0}`} />
          <MetricCard delta="Completed reports" label="Ended Sessions" value={`${data?.endedSessions ?? 0}`} />
          <MetricCard delta="Across ended sessions" label="Avg Confidence" value={`${data?.avgConfidence ?? 0}`} />
          <MetricCard delta="Answer quality trend" label="Avg Score" value={`${data?.avgScore ?? 0}`} />
        </DashboardGrid>
      </section>

      <SectionLayout className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <PerformanceTrendChart trend={data?.trend ?? []} />

        <DataPanel subtitle="Fast access to critical workflows." title="Workspace Actions & Usage">
          <div className="space-y-4">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Session completion</span>
                <span>{usagePercent}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${usagePercent}%` }} />
              </div>
            </div>
            <div className="grid gap-2">
            {[
              { href: "/resume", label: "Resume Workspace" },
              { href: "/interview", label: "Interview Room" },
              { href: "/report", label: "Reports" },
              { href: "/profile", label: "Profile & Usage" },
            ].map((item) => (
              <Link
                className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
            </div>
          </div>
        </DataPanel>
      </SectionLayout>

      <SectionLayout className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-3">
        <SectionHeader eyebrow="Activity" title="Recent Interviews" />
        <div className="space-y-3">
          {(data?.recent ?? []).length ? (
            data?.recent.map((item) => (
              <article className="panel flex flex-wrap items-center justify-between gap-3 p-4" key={item.id}>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {item.type === "technical" ? "Technical Interview" : "HR Interview"}
                  </p>
                  <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="rounded-full border border-slate-300 px-2 py-1 text-slate-600">{item.status}</span>
                  <span className="text-slate-700">Confidence {item.confidence}</span>
                </div>
              </article>
            ))
          ) : (
            <article className="panel p-4 text-sm text-slate-500">No interview activity yet.</article>
          )}
        </div>
        </div>

        <DataPanel subtitle="Operational overview for current usage window." title="Data Summary">
          <div className="space-y-3">
            {[
              { label: "Technical rounds", value: `${(data?.recent ?? []).filter((x) => x.type === "technical").length}` },
              { label: "HR rounds", value: `${(data?.recent ?? []).filter((x) => x.type === "hr").length}` },
              { label: "Completed this period", value: `${(data?.recent ?? []).filter((x) => x.status === "ended").length}` },
            ].map((item) => (
              <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2" key={item.label}>
                <span className="text-xs text-slate-600">{item.label}</span>
                <span className="text-sm font-semibold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </DataPanel>
      </SectionLayout>
    </PageContainer>
  );
}
