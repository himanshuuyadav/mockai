import mammoth from "mammoth";
import pdfParse from "pdf-parse";

const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_RESUME_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export function validateResumeFile(file: File) {
  const lowerName = file.name.toLowerCase();
  const hasValidExtension = lowerName.endsWith(".pdf") || lowerName.endsWith(".docx");
  const hasValidMimeType = ALLOWED_RESUME_MIME_TYPES.includes(
    file.type as (typeof ALLOWED_RESUME_MIME_TYPES)[number],
  );

  if (!hasValidMimeType && !hasValidExtension) {
    throw new Error("Invalid file type. Please upload a PDF or DOCX file.");
  }

  if (file.size > MAX_RESUME_SIZE_BYTES) {
    throw new Error("File is too large. Maximum allowed size is 5MB.");
  }
}

export async function parseResumeFile(file: File) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".pdf")) {
    const parsed = await pdfParse(buffer);
    return parsed.text.trim();
  }

  if (lowerName.endsWith(".docx")) {
    const parsed = await mammoth.extractRawText({ buffer });
    return parsed.value.trim();
  }

  throw new Error("Unsupported resume format. Please upload PDF or DOCX.");
}

export function summarizeResume(rawText: string) {
  const compact = rawText.replace(/\s+/g, " ").trim();
  return compact.slice(0, 2000);
}
