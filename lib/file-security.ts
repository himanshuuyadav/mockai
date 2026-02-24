import path from "path";

import { AppError } from "@/lib/errors";

const RESUME_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

const VIDEO_ALLOWED_MIME_TYPES = [
  "video/webm",
  "video/mp4",
  "video/quicktime",
] as const;

const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 80 * 1024 * 1024;

function assertSafeFilename(fileName: string) {
  if (!fileName || fileName.trim().length === 0) {
    throw new AppError("Invalid file name.", { statusCode: 400 });
  }

  if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    throw new AppError("Unsafe file name detected.", { statusCode: 400 });
  }
}

export function sanitizeFilename(fileName: string) {
  assertSafeFilename(fileName);
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);
  const sanitizedBase = base.replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/-+/g, "-").slice(0, 120);
  const sanitizedExt = ext.replace(/[^a-zA-Z0-9.]/g, "").slice(0, 10);
  return `${sanitizedBase || "file"}${sanitizedExt}`;
}

export function validateResumeUploadFile(file: File) {
  const lowerName = file.name.toLowerCase();
  const hasValidExtension = lowerName.endsWith(".pdf") || lowerName.endsWith(".docx");
  const hasValidMimeType = RESUME_ALLOWED_MIME_TYPES.includes(
    file.type as (typeof RESUME_ALLOWED_MIME_TYPES)[number],
  );

  if (!hasValidMimeType && !hasValidExtension) {
    throw new AppError("Invalid file type. Please upload a PDF or DOCX file.", { statusCode: 400 });
  }

  if (file.size > MAX_RESUME_SIZE_BYTES) {
    throw new AppError("File is too large. Maximum allowed size is 5MB.", { statusCode: 400 });
  }

  sanitizeFilename(file.name);
}

export function validateInterviewVideoFile(file: File) {
  if (!VIDEO_ALLOWED_MIME_TYPES.includes(file.type as (typeof VIDEO_ALLOWED_MIME_TYPES)[number])) {
    throw new AppError("Invalid video type. Allowed formats: webm, mp4.", { statusCode: 400 });
  }

  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    throw new AppError("Video is too large. Maximum allowed size is 80MB.", { statusCode: 400 });
  }

  sanitizeFilename(file.name || "video.webm");
}
