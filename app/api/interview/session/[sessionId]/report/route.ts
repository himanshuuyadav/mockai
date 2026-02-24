import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getInterviewReportBySessionId } from "@/services/interview.service";

export async function GET(
  _: Request,
  { params }: { params: { sessionId: string } },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const report = await getInterviewReportBySessionId({
      sessionId: params.sessionId,
      userId: session.user.id,
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch report.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
