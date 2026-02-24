import { redirect } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

import { MetricCard } from "@/components/ui/metric-card";
import { PageContainer } from "@/components/ui/page-container";
import { SectionHeader } from "@/components/ui/section-header";
import { SectionLayout } from "@/components/ui/section-layout";
import { TimelineItem } from "@/components/ui/timeline-item";
import { auth } from "@/lib/auth";
import { getInterviewReportBySessionId } from "@/services/interview.service";

const ReportCharts = dynamic(
  () => import("@/components/report/report-charts").then((mod) => mod.ReportCharts),
);

const FILLER_WORDS = ["um", "uh", "like", "you know", "basically", "actually", "literally", "kind of", "sort of"];

function highlightFillerWords(text: string) {
  if (!text) {
    return [];
  }
  const pattern = new RegExp(`\\b(${FILLER_WORDS.map((word) => word.replace(" ", "\\\\s+")).join("|")})\\b`, "gi");
  const parts = text.split(pattern);
  return parts.map((part, index) => {
    const isFiller = FILLER_WORDS.some((word) => new RegExp(`^${word.replace(" ", "\\\\s+")}$`, "i").test(part));
    return isFiller ? (
      <mark className="rounded bg-amber-100 px-1 text-amber-900" key={`${part}-${index}`}>
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    );
  });
}

type ReportPageProps = {
  searchParams?: { sessionId?: string };
};

export default async function ReportPage({ searchParams }: ReportPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const sessionId = searchParams?.sessionId;
  if (!sessionId) {
    return (
      <PageContainer>
        <section className="panel p-8">
          <div className="mb-4 flex flex-wrap gap-2">
            <Link className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50" href="/dashboard">
              Back to Dashboard
            </Link>
            <Link className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50" href="/">
              Home
            </Link>
          </div>
          <SectionHeader eyebrow="Report" title="No interview selected" description="End an interview to generate a report." />
        </section>
      </PageContainer>
    );
  }

  const report = await getInterviewReportBySessionId({ sessionId, userId: session.user.id });
  if (!report) {
    return (
      <PageContainer>
        <section className="panel p-8">
          <div className="mb-4 flex flex-wrap gap-2">
            <Link className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50" href="/dashboard">
              Back to Dashboard
            </Link>
            <Link className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50" href="/">
              Home
            </Link>
          </div>
          <SectionHeader eyebrow="Report" title="Report not found" />
        </section>
      </PageContainer>
    );
  }

  const finalReport = report.finalReport;
  const depthLabel = finalReport?.domainDepthLabel || (report.type === "hr" ? "Behavioral Depth" : "Technical Depth");
  const answers = report.transcripts
    .map((transcript, index) => ({
      transcript,
      question: report.questions[index] ?? "",
      score: report.scores[index] ?? 0,
      feedback: report.feedbacks[index] ?? "",
      analysis: report.analysisReports[index] ?? null,
    }))
    .filter((item) => item.transcript);

  return (
    <PageContainer className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <Link className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50" href="/dashboard">
          Back to Dashboard
        </Link>
        <Link className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50" href="/">
          Home
        </Link>
      </div>

      <SectionHeader
        eyebrow="Interview Report"
        title="Session Analysis"
        description={`Status: ${report.status}${report.endReason ? ` (${report.endReason})` : ""}`}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Confidence Score" value={`${finalReport?.confidenceScore ?? 0}`} />
        <MetricCard label="Speaking Speed" value={`${finalReport?.speakingSpeedWpm ?? 0} WPM`} />
        <MetricCard label={depthLabel} value={`${finalReport?.domainDepth ?? 0}`} />
        <MetricCard label="Filler Words" value={`${finalReport?.fillerWordsCount ?? 0}`} />
      </section>

      <ReportCharts depthLabel={depthLabel} timelineMarkers={finalReport?.timelineMarkers ?? []} />

      <SectionLayout>
        <SectionHeader eyebrow="Suggestions" title="Improvement Insights" />
        <article className="panel p-6">
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            {(finalReport?.improvementSuggestions ?? []).map((suggestion, index) => (
              <li key={`${suggestion}-${index}`}>{suggestion}</li>
            ))}
          </ul>
        </article>
      </SectionLayout>

      <SectionLayout>
        <SectionHeader eyebrow="Timeline" title="Question feedback timeline" />
        {answers.map((item, index) => (
          <TimelineItem
            body={item.feedback}
            key={`timeline-${index}`}
            subtitle={`Score ${item.score} · Confidence ${item.analysis?.confidenceScore ?? 0}`}
            title={`Q${index + 1}: ${item.question}`}
          />
        ))}
      </SectionLayout>

      <SectionLayout>
        <SectionHeader eyebrow="Transcript" title="Transcript with filler highlights" />
        {answers.map((item, index) => (
          <article className="panel p-4" key={`transcript-${index}`}>
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Answer {index + 1}</p>
            <p className="text-sm leading-relaxed text-slate-700">{highlightFillerWords(item.transcript)}</p>
          </article>
        ))}
      </SectionLayout>
    </PageContainer>
  );
}
