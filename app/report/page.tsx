import { redirect } from "next/navigation";

import { ReportCharts } from "@/components/report/report-charts";
import { auth } from "@/lib/auth";
import { getInterviewReportBySessionId } from "@/services/interview.service";

const FILLER_WORDS = ["um", "uh", "like", "you know", "basically", "actually", "literally", "kind of", "sort of"];

function highlightFillerWords(text: string) {
  if (!text) {
    return [];
  }

  const pattern = new RegExp(`\\b(${FILLER_WORDS.map((word) => word.replace(" ", "\\s+")).join("|")})\\b`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    const isFiller = FILLER_WORDS.some((word) => new RegExp(`^${word.replace(" ", "\\s+")}$`, "i").test(part));
    if (!isFiller) {
      return <span key={`${part}-${index}`}>{part}</span>;
    }
    return (
      <mark className="rounded bg-yellow-200 px-1" key={`${part}-${index}`}>
        {part}
      </mark>
    );
  });
}

type ReportPageProps = {
  searchParams?: {
    sessionId?: string;
  };
};

export default async function ReportPage({ searchParams }: ReportPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const sessionId = searchParams?.sessionId;

  if (!sessionId) {
    return (
      <main className="container py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Interview Report</h1>
        <p className="mt-2 text-slate-600">No session selected. End an interview to view its report.</p>
      </main>
    );
  }

  const report = await getInterviewReportBySessionId({
    sessionId,
    userId: session.user.id,
  });

  if (!report) {
    return (
      <main className="container py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Interview Report</h1>
        <p className="mt-2 text-slate-600">Report not found for this session.</p>
      </main>
    );
  }

  const finalReport = report.finalReport;
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
    <main className="container space-y-6 py-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Interview Report</h1>
        <p className="mt-2 text-slate-600">
          Session status: {report.status} {report.endReason ? `(${report.endReason})` : ""}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Confidence</p>
          <p className="mt-2 text-2xl font-semibold">{finalReport?.confidenceScore ?? 0}</p>
        </article>
        <article className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Speaking Speed</p>
          <p className="mt-2 text-2xl font-semibold">{finalReport?.speakingSpeedWpm ?? 0} WPM</p>
        </article>
        <article className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Technical Depth</p>
          <p className="mt-2 text-2xl font-semibold">{finalReport?.technicalDepth ?? 0}</p>
        </article>
        <article className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Filler Words</p>
          <p className="mt-2 text-2xl font-semibold">{finalReport?.fillerWordsCount ?? 0}</p>
        </article>
      </section>

      <ReportCharts timelineMarkers={finalReport?.timelineMarkers ?? []} />

      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Improvement Suggestions</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          {(finalReport?.improvementSuggestions ?? []).map((suggestion, index) => (
            <li key={`${suggestion}-${index}`}>{suggestion}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        {answers.map((item, index) => (
          <article className="rounded-xl border bg-white p-6" key={`answer-${index}`}>
            <p className="text-xs uppercase text-slate-500">Question {index + 1}</p>
            <p className="mt-1 text-sm font-medium">{item.question}</p>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <p className="text-sm">
                <span className="font-medium">Score:</span> {item.score}
              </p>
              <p className="text-sm">
                <span className="font-medium">Confidence:</span> {item.analysis?.confidenceScore ?? 0}
              </p>
              <p className="text-sm">
                <span className="font-medium">Clarity:</span> {item.analysis?.sentenceClarity ?? 0}
              </p>
            </div>

            <div className="mt-3 rounded-md border bg-slate-50 p-3 text-sm leading-relaxed">
              {highlightFillerWords(item.transcript)}
            </div>

            <p className="mt-3 text-sm text-slate-700">
              <span className="font-medium">AI Feedback:</span> {item.feedback}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
