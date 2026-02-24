import Link from "next/link";

import { UpgradeButton } from "@/components/billing/upgrade-button";
import { PageContainer } from "@/components/ui/page-container";
import { SectionHeader } from "@/components/ui/section-header";
import { auth } from "@/lib/auth";

const featureRows = [
  { label: "Interviews per month", free: "5", pro: "Unlimited" },
  { label: "Interview types", free: "Technical + HR", pro: "Technical + HR" },
  { label: "Resume-aware interview depth", free: "Basic", pro: "Advanced" },
  { label: "AI analysis depth", free: "Standard", pro: "Advanced + priority" },
  { label: "Report detail", free: "Standard report", pro: "Full report" },
];

export default async function PricingPage() {
  const session = await auth();
  const currentTier = session?.user?.subscriptionTier ?? "free";

  return (
    <PageContainer className="space-y-8 pt-10">
      <SectionHeader
        eyebrow="Pricing"
        title="Simple SaaS pricing for interview prep"
        description="Start free and upgrade when you need unlimited interviews and deeper analysis."
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="panel p-6">
          <p className="text-xs uppercase tracking-wide text-slate-500">Free Plan</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">$0</h2>
          <p className="mt-1 text-sm text-slate-600">For early practice and basic reporting.</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>5 interviews/month</li>
            <li>Basic analytics + standard reports</li>
            <li>Core resume parsing</li>
          </ul>
        </article>

        <article className="panel border-indigo-200 p-6">
          <p className="text-xs uppercase tracking-wide text-indigo-600">Pro Plan</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Paid via Stripe</h2>
          <p className="mt-1 text-sm text-slate-600">Unlimited interviews and advanced AI depth.</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>Unlimited interviews</li>
            <li>Advanced resume-based analysis</li>
            <li>Full reports + priority processing</li>
          </ul>
          <div className="mt-5">
            {currentTier === "pro" ? (
              <Link className="text-sm font-medium text-indigo-600 hover:text-indigo-700" href="/dashboard">
                You are on Pro. Go to dashboard.
              </Link>
            ) : (
              <UpgradeButton />
            )}
          </div>
        </article>
      </section>

      <section className="panel overflow-x-auto p-4">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-2 py-3">Feature</th>
              <th className="px-2 py-3">Free</th>
              <th className="px-2 py-3">Pro</th>
            </tr>
          </thead>
          <tbody>
            {featureRows.map((row) => (
              <tr className="border-b border-slate-100 text-sm text-slate-700" key={row.label}>
                <td className="px-2 py-3">{row.label}</td>
                <td className="px-2 py-3">{row.free}</td>
                <td className="px-2 py-3">{row.pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </PageContainer>
  );
}
