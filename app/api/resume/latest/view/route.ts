import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getLatestResumeByUserId } from "@/services/resume.service";
import { getSignedResumeViewUrl } from "@/services/cloudinary.service";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const latestResume = await getLatestResumeByUserId(session.user.id);
    if (!latestResume?.originalFileUrl) {
      return NextResponse.json({ error: "No resume found." }, { status: 404 });
    }

    const signedUrl = getSignedResumeViewUrl(latestResume.originalFileUrl);
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate resume view URL.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
