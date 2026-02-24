import { Readable } from "stream";

import { cloudinary } from "@/lib/cloudinary";
import { getRequiredEnv } from "@/lib/env";
import { sanitizeFilename } from "@/lib/file-security";
import { logger } from "@/lib/logger";

type UploadResumeFileInput = {
  fileBuffer: Buffer;
  fileName: string;
  userId: string;
};

type UploadInterviewVideoInput = {
  fileBuffer: Buffer;
  userId: string;
  sessionId: string;
  questionIndex: number;
};

function ensureCloudinaryConfig() {
  getRequiredEnv("CLOUDINARY_CLOUD_NAME");
  getRequiredEnv("CLOUDINARY_API_KEY");
  getRequiredEnv("CLOUDINARY_API_SECRET");
}

export async function uploadResumeFileToCloudinary({
  fileBuffer,
  fileName,
  userId,
}: UploadResumeFileInput) {
  ensureCloudinaryConfig();

  const safeFileName = sanitizeFilename(fileName);

  try {
    return await new Promise<{ secureUrl: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `mockai/resumes/${userId}`,
          resource_type: "raw",
          type: "upload",
          access_mode: "public",
          public_id: `${Date.now()}-${safeFileName}`,
          use_filename: true,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary upload failed"));
            return;
          }

          resolve({ secureUrl: result.secure_url });
        },
      );

      Readable.from(fileBuffer).pipe(uploadStream);
    });
  } catch (error) {
    logger.error("cloudinary_resume_upload_failed", {
      userId,
      fileName: safeFileName,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

export async function uploadInterviewVideoToCloudinary({
  fileBuffer,
  userId,
  sessionId,
  questionIndex,
}: UploadInterviewVideoInput) {
  ensureCloudinaryConfig();

  try {
    return await new Promise<{ secureUrl: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `mockai/interviews/${userId}/${sessionId}`,
          resource_type: "video",
          public_id: `q-${questionIndex + 1}-${Date.now()}`,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary video upload failed"));
            return;
          }

          resolve({ secureUrl: result.secure_url });
        },
      );

      Readable.from(fileBuffer).pipe(uploadStream);
    });
  } catch (error) {
    logger.error("cloudinary_video_upload_failed", {
      userId,
      sessionId,
      questionIndex,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

function extractCloudinaryRawPublicId(originalFileUrl: string) {
  const match = originalFileUrl.match(/\/raw\/upload\/(?:v\d+\/)?(.+)$/);
  if (!match?.[1]) {
    throw new Error("Unable to parse Cloudinary raw URL.");
  }

  // For raw assets, the extension is part of the public_id.
  return decodeURIComponent(match[1]);
}

export function getSignedResumeViewUrl(originalFileUrl: string) {
  ensureCloudinaryConfig();

  const publicId = extractCloudinaryRawPublicId(originalFileUrl);
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 10;

  return cloudinary.utils.private_download_url(publicId, "", {
    resource_type: "raw",
    type: "upload",
    expires_at: expiresAt,
  });
}
