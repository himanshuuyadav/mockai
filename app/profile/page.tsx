import { redirect } from "next/navigation";

import { MetricCard } from "@/components/ui/metric-card";
import { PageContainer } from "@/components/ui/page-container";
import { SectionHeader } from "@/components/ui/section-header";
import { SectionLayout } from "@/components/ui/section-layout";
import { auth } from "@/lib/auth";
import { findUserProfileById, getUserUsageStats } from "@/services/user.service";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

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
