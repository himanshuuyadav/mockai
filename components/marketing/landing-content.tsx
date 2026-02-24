import Link from "next/link";

import { CleanButton } from "@/components/ui/clean-button";
import { InsightCard } from "@/components/ui/insight-card";
import { PageContainer } from "@/components/ui/page-container";
import { SectionHeader } from "@/components/ui/section-header";
import { SectionLayout } from "@/components/ui/section-layout";

const architectureBlocks = [
  {
    icon: "AI",
    title: "Interview Orchestration",
    description:
      "Adaptive technical and HR questioning anchored to candidate profile and role context.",
    metric: "42k",
    metricLabel: "Questions generated",
    lines: ["Context-aware prompts", "Follow-up logic", "Round type controls"],
  },
  {
    icon: "RS",
    title: "Resume Intelligence",
    description:
      "Structured extraction of skills, projects, experience, and behavior signals from uploaded resumes.",
    metric: "18k",
    metricLabel: "Resumes parsed",
    lines: ["PDF + DOCX parsing", "Structured JSON mapping", "Signal enrichment"],
  },
  {
    icon: "RP",
    title: "Reporting Layer",
    description:
      "Session-level metrics, transcript analysis, and timeline feedback for measurable improvement.",
    metric: "9.7k",
    metricLabel: "Reports generated",
    lines: ["Confidence trend", "Speech delivery metrics", "Actionable suggestions"],
  },
];

const featureRows = [
  {
    title: "Operational interview workflows",
    body: "Use one structured workspace for interview setup, live sessions, and post-round diagnostics.",
    points: ["Interview room controls", "Transcript capture", "Session handoff to report"],
  },
  {
    title: "Enterprise-ready review loops",
    body: "Build repeatable preparation cycles with consistent scoring and contextual AI feedback.",
    points: ["Round-aware scoring", "Behavioral and technical depth", "Timeline-based review"],
  },
];

const trustLabels = ["Used by placement cohorts", "Built for interview coaches", "Structured for hiring teams"];

export function LandingContent({ loggedIn }: { loggedIn: boolean }) {
  return (
    <PageContainer className="space-y-16 py-14 md:py-16">
      <SectionLayout className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
        <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_1fr]">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.16em] text-indigo-600">MockAI Platform</p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-slate-900 md:text-6xl">
              Interview preparation with structured product depth.
            </h1>
            <p className="max-w-xl text-base text-slate-600 md:text-lg">
              A unified workspace for resume intelligence, live interviews, and analytics designed for professional preparation outcomes.
            </p>

            <div className="flex flex-wrap gap-3">
              <CleanButton asChild>
                <Link href={loggedIn ? "/interview" : "/login"}>Start Interview</Link>
              </CleanButton>
              <CleanButton asChild variant="outline">
                <Link href="/dashboard">View Dashboard</Link>
              </CleanButton>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {trustLabels.map((label) => (
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600" key={label}>
                  {label}
                </div>
              ))}
            </div>
          </div>

          <article className="rounded-xl border border-slate-200 bg-slate-50">
            <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-slate-50 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-indigo-700">Product Preview</p>
              <p className="mt-1 text-sm text-slate-700">Live interview workspace snapshot</p>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs text-slate-500">Current AI question</p>
                <p className="mt-1 text-sm text-slate-800">Tell me about a high-stakes decision and the tradeoff you made.</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Confidence", value: "84" },
                  { label: "Clarity", value: "79" },
                  { label: "WPM", value: "132" },
                ].map((item) => (
                  <div className="rounded-lg border border-slate-200 bg-white p-3" key={item.label}>
                    <p className="text-[11px] text-slate-500">{item.label}</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs text-slate-500">Secondary actions</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link className="rounded border border-slate-200 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50" href="/resume">
                    Resume workspace
                  </Link>
                  <Link className="rounded border border-slate-200 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50" href="/report">
                    View reports
                  </Link>
                </div>
              </div>
            </div>
          </article>
        </div>
      </SectionLayout>

      <SectionLayout className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 md:p-8">
        <SectionHeader
          eyebrow="Platform Architecture"
          title="Three connected layers powering every interview workflow"
          description="Structured capability blocks with metrics and operational depth, designed for real usage scale."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {architectureBlocks.map((block) => (
            <article className="rounded-xl border border-slate-200 bg-white p-5" key={block.title}>
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
                  {block.icon}
                </span>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{block.metric}</p>
                  <p className="text-[11px] text-slate-500">{block.metricLabel}</p>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-slate-900">{block.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{block.description}</p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                {block.lines.map((line) => (
                  <li className="flex items-start gap-2" key={line}>
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </SectionLayout>

      <SectionLayout className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
        <SectionHeader
          eyebrow="Operational Depth"
          title="Built like an active SaaS product, not a static marketing shell"
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {featureRows.map((row) => (
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-5" key={row.title}>
              <h3 className="text-sm font-semibold text-slate-900">{row.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{row.body}</p>
              <div className="mt-3 space-y-1.5">
                {row.points.map((point) => (
                  <p className="text-xs text-slate-600" key={point}>
                    {point}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </SectionLayout>

      <SectionLayout className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionHeader eyebrow="Pricing" title="Simple and predictable plans" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">Free</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">$0</p>
                <p className="mt-2 text-sm text-slate-600">Core parsing + short sessions + essential reporting.</p>
              </div>
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Pro</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">$19</p>
                <p className="mt-2 text-sm text-slate-600">Long sessions, expanded analytics, richer interview history.</p>
              </div>
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionHeader eyebrow="Usage Signals" title="Current platform activity" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { label: "Daily sessions", value: "1,248" },
                { label: "Reports processed", value: "9,732" },
                { label: "Avg confidence", value: "78" },
                { label: "Session completion", value: "86%" },
              ].map((item) => (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3" key={item.label}>
                  <p className="text-[11px] text-slate-500">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </SectionLayout>

      <footer className="border-t border-slate-200 pt-8 text-sm text-slate-500">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p>MockAI © {new Date().getFullYear()}</p>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/report">Reports</Link>
            <Link href="/profile">Profile</Link>
          </div>
        </div>
      </footer>
    </PageContainer>
  );
}

