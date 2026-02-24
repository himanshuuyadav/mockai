import { requireSessionUser, withErrorHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";
import { validateResumeUploadFile } from "@/lib/file-security";
import { RateLimitRules } from "@/lib/rate-limit";
import { processResumeUpload } from "@/services/resume.service";
import { getBillingSnapshotByUserId } from "@/services/user.service";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(
  async (request: Request) => {
    const user = await requireSessionUser();
    const formData = await request.formData();
    const fileValue = formData.get("file");
    const billing = await getBillingSnapshotByUserId(user.id);

    if (!(fileValue instanceof File)) {
      throw new AppError("Resume file is required.", { statusCode: 400 });
    }
    validateResumeUploadFile(fileValue);

    const resume = await processResumeUpload({
      userId: user.id,
      file: fileValue,
      subscriptionTier: billing?.subscriptionTier ?? "free",
    });

    return {
      id: resume._id.toString(),
      originalFileUrl: resume.originalFileUrl,
      structuredData: resume.structuredData,
      createdAt: resume.createdAt,
      deepAnalysisEnabled: (billing?.subscriptionTier ?? "free") === "pro",
    };
  },
  {
    route: "api.resume.upload",
    rateLimit: RateLimitRules.resumeUpload,
  },
);
