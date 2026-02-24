import { AppError } from "@/lib/errors";
import { requireSessionUser, withErrorHandler } from "@/lib/api-handler";
import { getLatestResumeByUserId } from "@/services/resume.service";
import { getSignedResumeViewUrl } from "@/services/cloudinary.service";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(
  async () => {
    const user = await requireSessionUser();
    const latestResume = await getLatestResumeByUserId(user.id);
    if (!latestResume?.originalFileUrl) {
      throw new AppError("No resume found.", { statusCode: 404 });
    }

    const signedUrl = getSignedResumeViewUrl(latestResume.originalFileUrl);
    return Response.redirect(signedUrl);
  },
  {
    route: "api.resume.view",
  },
);
