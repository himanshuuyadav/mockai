import { withErrorHandler, requireSessionUser } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";
import { RateLimitRules } from "@/lib/rate-limit";
import { createInterviewSessionBodySchema } from "@/lib/schemas/api";
import { createInterviewSession } from "@/services/interview.service";
import { getLatestResumeRecordByUserId } from "@/services/resume.service";
import { assertInterviewAccess, syncMonthlyInterviewAllowance } from "@/services/user.service";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(
  async (request: Request) => {
    const user = await requireSessionUser();

    const payload = createInterviewSessionBodySchema.parse(await request.json());
    const allowance = await assertInterviewAccess(user.id);
    const latestResume = await getLatestResumeRecordByUserId(user.id);

    if (!latestResume) {
      throw new AppError("No resume found. Upload a resume before starting interview.", { statusCode: 400 });
    }

    const createdSession = await createInterviewSession({
      userId: user.id,
      resumeId: latestResume._id.toString(),
      type: payload.type,
      jdInfo: payload.jdInfo?.trim() || "",
      structuredResume: latestResume.structuredData,
      subscriptionTier: allowance.subscriptionTier,
    });
    await syncMonthlyInterviewAllowance(user.id);

    return createdSession;
  },
  {
    route: "api.interview.create",
    rateLimit: RateLimitRules.interviewCreate,
  },
);
