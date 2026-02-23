import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { createInterviewSession } from "@/services/interview.service";
import { getLatestResumeRecordByUserId } from "@/services/resume.service";

const createInterviewSessionSchema = z.object({
  type: z.enum(["technical", "hr"]),
  jdInfo: z.string().max(3000).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = createInterviewSessionSchema.parse(await request.json());
    const latestResume = await getLatestResumeRecordByUserId(session.user.id);

    if (!latestResume) {
      return NextResponse.json(
        { error: "No resume found. Upload a resume before starting interview." },
        { status: 400 },
      );
    }

    const createdSession = await createInterviewSession({
      userId: session.user.id,
      resumeId: latestResume._id.toString(),
      type: payload.type,
      jdInfo: payload.jdInfo?.trim() || "",
      structuredResume: latestResume.structuredData,
    });

    return NextResponse.json(createdSession);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create interview session.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
