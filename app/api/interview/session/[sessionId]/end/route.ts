import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { endInterviewSession } from "@/services/interview.service";

const endInterviewSchema = z.object({
  reason: z.enum(["manual", "auto_time_limit"]).default("manual"),
});

export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";

    let reason: "manual" | "auto_time_limit" = "manual";
    let transcript: string | undefined;
    let videoFile: File | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const payload = endInterviewSchema.parse({
        reason: formData.get("reason"),
      });
      reason = payload.reason;

      const transcriptValue = formData.get("transcript");
      if (typeof transcriptValue === "string" && transcriptValue.trim()) {
        transcript = transcriptValue.trim();
      }

      const videoValue = formData.get("video");
      if (videoValue instanceof File) {
        videoFile = videoValue;
      }
    } else {
      const body = await request.json().catch(() => ({}));
      const payload = endInterviewSchema.parse(body);
      reason = payload.reason;
    }

    const ended = await endInterviewSession({
      sessionId: params.sessionId,
      userId: session.user.id,
      reason,
      transcript,
      videoFile,
    });

    return NextResponse.json(ended);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to end interview session.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
