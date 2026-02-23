import mammoth from "mammoth";
import pdfParse from "pdf-parse";

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
