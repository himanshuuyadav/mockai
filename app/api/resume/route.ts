import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { processResumeUpload } from "@/services/resume.service";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const fileValue = formData.get("file");

    if (!(fileValue instanceof File)) {
      return NextResponse.json({ error: "Resume file is required." }, { status: 400 });
    }

    const resume = await processResumeUpload({
      userId: session.user.id,
      file: fileValue,
    });

    return NextResponse.json({
      id: resume._id.toString(),
      originalFileUrl: resume.originalFileUrl,
      structuredData: resume.structuredData,
      createdAt: resume.createdAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error while processing resume.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
