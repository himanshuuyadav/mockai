import { notFound, redirect } from "next/navigation";

import { LiveInterviewSession } from "@/components/interview/live-interview-session";
import { auth } from "@/lib/auth";
import { getInterviewSessionRuntime } from "@/services/interview.service";

type InterviewSessionPageProps = {
  params: {
    sessionId: string;
  };
};

export default async function InterviewSessionPage({ params }: InterviewSessionPageProps) {
  const userSession = await auth();

  if (!userSession?.user?.id) {
    redirect("/login");
  }

  const runtimeSession = await getInterviewSessionRuntime({
    sessionId: params.sessionId,
    userId: userSession.user.id,
  });

  if (!runtimeSession) {
    notFound();
  }

  if (runtimeSession.status === "ended") {
    redirect(`/report?sessionId=${params.sessionId}`);
  }

  const initialQuestion = runtimeSession.questions[runtimeSession.questions.length - 1] ?? "";

  return (
    <LiveInterviewSession
      initialQuestion={initialQuestion}
      isFreeUser={runtimeSession.subscriptionTier === "free"}
      sessionId={params.sessionId}
      sessionType={runtimeSession.type}
    />
  );
}
