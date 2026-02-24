import { requireSessionUser, withErrorHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";
import { validateInterviewVideoFile } from "@/lib/file-security";
import { RateLimitRules } from "@/lib/rate-limit";
import { sessionIdParamSchema, submitInterviewAnswerSchema } from "@/lib/schemas/api";
import { submitInterviewAnswerAndGenerateFollowUp } from "@/services/interview.service";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(
  async (
    request: Request,
    { params }: { params: { sessionId: string } },
  ) => {
    const user = await requireSessionUser();
    const parsedParams = sessionIdParamSchema.parse(params);
    const formData = await request.formData();
    const transcriptValue = submitInterviewAnswerSchema.parse({
      transcript: formData.get("transcript"),
    });
    const videoValue = formData.get("video");

    if (videoValue instanceof File) {
      validateInterviewVideoFile(videoValue);
    }

    const result = await submitInterviewAnswerAndGenerateFollowUp({
      sessionId: parsedParams.sessionId,
      userId: user.id,
      transcript: transcriptValue.transcript,
      videoFile: videoValue instanceof File ? videoValue : undefined,
    });

    if (!result.followUpQuestion) {
      throw new AppError("Unable to process interview answer.", { statusCode: 500 });
    }

    return result;
  },
  {
    route: "api.interview.answer",
    rateLimit: RateLimitRules.aiCalls,
  },
);
