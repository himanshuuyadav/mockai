import { redirect } from "next/navigation";

import { StartInterviewForm } from "@/components/interview/start-interview-form";
import { PageContainer } from "@/components/ui/page-container";
import { SectionHeader } from "@/components/ui/section-header";
import { auth } from "@/lib/auth";
import { getLatestResumeRecordByUserId } from "@/services/resume.service";

export default async function InterviewPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const latestResume = await getLatestResumeRecordByUserId(session.user.id);

  return (
    <PageContainer className="space-y-6">
      <SectionHeader
        eyebrow="Interview Room"
        title="Live Interview Workspace"
        description="Focused interface for question flow, transcript capture, and answer submission."
      />

      <StartInterviewForm
        canStart={Boolean(latestResume)}
      />
    </PageContainer>
  );
}
