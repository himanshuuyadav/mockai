"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

const ACCEPTED_TYPES = ".pdf,.docx";

export function ResumeUploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Please choose a PDF or DOCX resume file.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/resume", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Upload failed.");
      }

      router.refresh();
      setFile(null);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unexpected upload error.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="panel p-6" id="resume-upload" onSubmit={handleSubmit}>
      <h2 className="text-lg font-semibold text-slate-900">Upload Resume</h2>
      <p className="mt-1 text-sm text-slate-600">Accepted formats: PDF, DOCX. Max size: 5MB.</p>

      <div className="mt-4 space-y-3">
        <input
          accept={ACCEPTED_TYPES}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-500"
          onChange={handleFileChange}
          type="file"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>

      <Button className="mt-4" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Processing..." : "Upload and Parse"}
      </Button>
    </form>
  );
}
