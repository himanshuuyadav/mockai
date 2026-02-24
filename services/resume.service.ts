import { createHash } from "crypto";

import { connectToDatabase } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { SubscriptionTier } from "@/lib/subscription";
import { logger } from "@/lib/logger";
import { Resume } from "@/models/Resume";
import { structureResumeData } from "@/services/ai.service";
import { uploadResumeFileToCloudinary } from "@/services/cloudinary.service";
import { parseResumeFile, validateResumeFile } from "@/services/resume-parser.service";

type ProcessResumeUploadInput = {
  userId: string;
  file: File;
  subscriptionTier: SubscriptionTier;
};

const resumeStructuringCache = new Map<string, Awaited<ReturnType<typeof structureResumeData>>>();

function toBasicStructuredResume(data: Awaited<ReturnType<typeof structureResumeData>>) {
  return {
    skills: data.skills.slice(0, 20),
    achievements: [],
    projects: data.projects.map((project) => ({
      name: project.name,
      tech: project.tech.slice(0, 8),
      description: "",
    })),
    experience: data.experience,
    extracurricularExperience: [],
    education: data.education,
  };
}

export async function processResumeUpload({ userId, file, subscriptionTier }: ProcessResumeUploadInput) {
  try {
    validateResumeFile(file);
  } catch (error) {
    throw new AppError(error instanceof Error ? error.message : "Invalid resume file.", { statusCode: 400 });
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());

  let uploadResult: { secureUrl: string };
  try {
    uploadResult = await uploadResumeFileToCloudinary({
      fileBuffer,
      fileName: file.name,
      userId,
    });
  } catch (error) {
    throw new AppError("Unable to upload resume file. Please try again.", { statusCode: 502 });
  }

  let extractedText = "";
  try {
    extractedText = await parseResumeFile(file);
  } catch (error) {
    logger.error("resume_parse_failed", {
      userId,
      fileName: file.name,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new AppError("Unable to parse resume text from this file.", { statusCode: 400 });
  }

  const hash = createHash("sha256").update(extractedText).digest("hex");
  const cacheKey = `${userId}:${hash}`;

  let advancedStructuredData = resumeStructuringCache.get(cacheKey);

  if (!advancedStructuredData) {
    await connectToDatabase();
    const existingResume = await Resume.findOne({
      userId,
      extractedText,
    })
      .sort({ createdAt: -1 })
      .select("structuredData")
      .lean<{ structuredData: Awaited<ReturnType<typeof structureResumeData>> } | null>();

    if (existingResume?.structuredData) {
      advancedStructuredData = existingResume.structuredData;
    }
  }

  if (!advancedStructuredData) {
    try {
      advancedStructuredData = await structureResumeData(extractedText);
      resumeStructuringCache.set(cacheKey, advancedStructuredData);
    } catch (error) {
      logger.error("resume_structuring_failed", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new AppError("Unable to structure resume details right now.", { statusCode: 503 });
    }
  }

  const structuredData =
    subscriptionTier === "pro" ? advancedStructuredData : toBasicStructuredResume(advancedStructuredData);

  try {
    await connectToDatabase();
    const resume = await Resume.create({
      userId,
      originalFileUrl: uploadResult.secureUrl,
      extractedText,
      structuredData,
    });

    return resume;
  } catch (error) {
    logger.error("resume_db_save_failed", {
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new AppError("Unable to save resume record.", { statusCode: 500 });
  }
}

export async function getLatestResumeByUserId(userId: string) {
  await connectToDatabase();

  return Resume.findOne({ userId })
    .sort({ createdAt: -1 })
    .select("originalFileUrl extractedText structuredData createdAt")
    .lean<{
      originalFileUrl: string;
      extractedText: string;
      structuredData: {
        skills: string[];
        achievements: string[];
        projects: { name: string; tech: string[]; description: string }[];
        experience: { role: string; company: string; duration: string }[];
        extracurricularExperience: {
          activity: string;
          organization: string;
          duration: string;
          description: string;
        }[];
        education: string[];
      };
      createdAt: Date;
    } | null>();
}

export async function getLatestResumeRecordByUserId(userId: string) {
  await connectToDatabase();

  return Resume.findOne({ userId })
    .sort({ createdAt: -1 })
    .select("structuredData")
    .lean<{
      _id: { toString(): string };
      structuredData: {
        skills: string[];
        achievements: string[];
        projects: { name: string; tech: string[]; description: string }[];
        experience: { role: string; company: string; duration: string }[];
        extracurricularExperience: {
          activity: string;
          organization: string;
          duration: string;
          description: string;
        }[];
        education: string[];
      };
    } | null>();
}
