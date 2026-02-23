import { redirect } from "next/navigation";

import { StartInterviewForm } from "@/components/interview/start-interview-form";
import { auth } from "@/lib/auth";
import { getLatestResumeRecordByUserId } from "@/services/resume.service";

export default async function InterviewPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const latestResume = await getLatestResumeRecordByUserId(session.user.id);

  return (
    <main className="container py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Interview Workspace</h1>
      <p className="mt-2 text-slate-600">Start a technical or HR interview based on your latest resume.</p>

      <section className="mt-8">
        <StartInterviewForm canStart={Boolean(latestResume)} />
      </section>
    </main>
  );
}
