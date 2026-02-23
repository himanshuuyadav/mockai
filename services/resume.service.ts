import { connectToDatabase } from "@/lib/db";
import { Resume } from "@/models/Resume";
import { structureResumeData } from "@/services/ai.service";
import { uploadResumeFileToCloudinary } from "@/services/cloudinary.service";
import { parseResumeFile, validateResumeFile } from "@/services/resume-parser.service";

type ProcessResumeUploadInput = {
  userId: string;
  file: File;
};

export async function processResumeUpload({ userId, file }: ProcessResumeUploadInput) {
  validateResumeFile(file);

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const uploadResult = await uploadResumeFileToCloudinary({
    fileBuffer,
    fileName: file.name,
    userId,
  });

  const extractedText = await parseResumeFile(file);
  const structuredData = await structureResumeData(extractedText);

  await connectToDatabase();
  const resume = await Resume.create({
    userId,
    originalFileUrl: uploadResult.secureUrl,
    extractedText,
    structuredData,
  });

  return resume;
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
