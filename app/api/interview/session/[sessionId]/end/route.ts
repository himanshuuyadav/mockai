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

    const body = await request.json().catch(() => ({}));
    const payload = endInterviewSchema.parse(body);

    const ended = await endInterviewSession({
      sessionId: params.sessionId,
      userId: session.user.id,
      reason: payload.reason,
    });

    return NextResponse.json(ended);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to end interview session.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
