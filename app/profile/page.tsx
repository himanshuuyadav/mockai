import { redirect } from "next/navigation";
import Link from "next/link";

import { CancelSubscriptionButton } from "@/components/billing/cancel-subscription-button";
import { UpgradeButton } from "@/components/billing/upgrade-button";
import { MetricCard } from "@/components/ui/metric-card";
import { PageContainer } from "@/components/ui/page-container";
import { SectionHeader } from "@/components/ui/section-header";
import { SectionLayout } from "@/components/ui/section-layout";
import { auth } from "@/lib/auth";
import { findUserProfileById, getUserUsageStats, syncMonthlyInterviewAllowance } from "@/services/user.service";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await syncMonthlyInterviewAllowance(session.user.id);
  const user = await findUserProfileById(session.user.id);
  const usage = await getUserUsageStats(session.user.id);

  return (
    <PageContainer className="space-y-8">
      <SectionHeader
        eyebrow="Profile"
        title="Account and usage overview"
        description="Manage account identity, subscription details, and recent interview usage."
      />

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <article className="panel grid gap-4 p-5 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Name</p>
            <p className="mt-1 text-sm text-slate-900">{user?.name || "N/A"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
            <p className="mt-1 text-sm text-slate-900">{user?.email || session.user.email || "N/A"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Subscription</p>
            <p className="mt-1 text-sm capitalize text-indigo-600">{user?.subscriptionTier || "free"}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
              Status: <span className="capitalize text-slate-700">{user?.subscriptionStatus || "inactive"}</span>
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Member Since</p>
            <p className="mt-1 text-sm text-slate-900">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
            </p>
          </div>
        </article>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <MetricCard label="Total Sessions" value={`${usage.totalSessions}`} />
          <MetricCard label="Completed Sessions" value={`${usage.completedSessions}`} />
          <MetricCard label="Avg Confidence" value={`${usage.avgConfidence}`} />
        </div>
      </section>

      <SectionLayout>
        <SectionHeader
          eyebrow="Billing"
          title="Subscription and billing controls"
          description="Upgrade to unlock unlimited interviews and advanced AI analysis."
        />
        <article className="panel flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm text-slate-700">
              Current plan: <span className="font-semibold capitalize">{user?.subscriptionTier || "free"}</span>
            </p>
            <p className="mt-1 text-sm text-slate-700">
              Interviews remaining this month:{" "}
              <span className="font-semibold">{user?.subscriptionTier === "pro" ? "Unlimited" : user?.interviewsRemaining ?? 0}</span>
            </p>
            {user?.stripeCustomerId ? (
              <p className="mt-1 text-xs text-slate-500">Billing customer ID: {user.stripeCustomerId}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {user?.subscriptionTier === "pro" ? (
              <CancelSubscriptionButton disabled={user.subscriptionStatus === "canceled"} />
            ) : (
              <>
                <UpgradeButton />
                <Link className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" href="/pricing">
                  View Pricing
                </Link>
              </>
            )}
          </div>
        </article>
      </SectionLayout>

      <SectionLayout>
        <SectionHeader eyebrow="History" title="Recent interview activity" />
        {(usage.recentSessions || []).length ? (
          usage.recentSessions.map((item, index) => (
            <article className="panel flex flex-wrap items-center justify-between gap-3 p-4" key={`${item.createdAt}-${index}`}>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {item.type === "technical" ? "Technical Round" : "HR Round"}
                </p>
                <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="rounded-full border border-slate-300 px-2 py-1 text-slate-600">{item.status}</span>
                <span className="text-slate-700">Confidence {item.finalReport?.confidenceScore ?? 0}</span>
              </div>
            </article>
          ))
        ) : (
          <article className="panel p-4 text-sm text-slate-500">No interview sessions yet.</article>
        )}
      </SectionLayout>
    </PageContainer>
  );
}
