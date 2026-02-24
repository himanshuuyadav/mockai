import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { submitInterviewAnswerAndGenerateFollowUp } from "@/services/interview.service";

export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const transcriptValue = formData.get("transcript");
    const videoValue = formData.get("video");

    if (typeof transcriptValue !== "string" || !transcriptValue.trim()) {
      return NextResponse.json({ error: "Transcript is required." }, { status: 400 });
    }

    const result = await submitInterviewAnswerAndGenerateFollowUp({
      sessionId: params.sessionId,
      userId: session.user.id,
      transcript: transcriptValue.trim(),
      videoFile: videoValue instanceof File ? videoValue : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process interview answer.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
