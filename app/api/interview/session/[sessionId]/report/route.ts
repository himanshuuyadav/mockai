import { assertFound, requireSessionUser, withErrorHandler } from "@/lib/api-handler";
import { sessionIdParamSchema } from "@/lib/schemas/api";
import { getInterviewReportBySessionId } from "@/services/interview.service";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(
  async (
    _: Request,
    { params }: { params: { sessionId: string } },
  ) => {
    const user = await requireSessionUser();
    const parsedParams = sessionIdParamSchema.parse(params);
    const report = await getInterviewReportBySessionId({
      sessionId: parsedParams.sessionId,
      userId: user.id,
    });

    return assertFound(report, "Report not found.");
  },
  {
    route: "api.interview.report",
  },
);
