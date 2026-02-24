import { requireSessionUser, withErrorHandler } from "@/lib/api-handler";
import { validateInterviewVideoFile } from "@/lib/file-security";
import { endInterviewSchema, sessionIdParamSchema } from "@/lib/schemas/api";
import { endInterviewSession } from "@/services/interview.service";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(
  async (
    request: Request,
    { params }: { params: { sessionId: string } },
  ) => {
    const user = await requireSessionUser();
    const parsedParams = sessionIdParamSchema.parse(params);
    const contentType = request.headers.get("content-type") || "";

    let reason: "manual" | "auto_time_limit" = "manual";
    let transcript: string | undefined;
    let videoFile: File | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const payload = endInterviewSchema.parse({
        reason: formData.get("reason") ?? undefined,
      });
      reason = payload.reason;

      const transcriptValue = formData.get("transcript");
      if (typeof transcriptValue === "string" && transcriptValue.trim()) {
        transcript = transcriptValue.trim();
      }

      const videoValue = formData.get("video");
      if (videoValue instanceof File) {
        validateInterviewVideoFile(videoValue);
        videoFile = videoValue;
      }
    } else {
      const body = await request.json().catch(() => ({}));
      const payload = endInterviewSchema.parse(body);
      reason = payload.reason;
    }

    return endInterviewSession({
      sessionId: parsedParams.sessionId,
      userId: user.id,
      reason,
      transcript,
      videoFile,
    });
  },
  {
    route: "api.interview.end",
  },
);
