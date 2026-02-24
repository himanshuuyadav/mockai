"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { parseApiResponse } from "@/lib/api-client";

type InterviewType = "technical" | "hr";

type CreateSessionResponse = {
  id: string;
};

export function StartInterviewForm({
  canStart,
}: {
  canStart: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<InterviewType>("technical");
  const [jdInfo, setJdInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStartSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/interview/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          jdInfo: jdInfo.trim() || undefined,
        }),
      });

      const payload = await parseApiResponse<CreateSessionResponse>(response);

      setShowForm(false);
      router.push(`/interview/session/${payload.id}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }

  if (!canStart) {
    return (
      <section className="panel p-6">
        <h2 className="text-lg font-semibold text-slate-900">Start Interview</h2>
        <p className="mt-2 text-sm text-slate-600">
          Upload at least one resume before starting an interview session.
        </p>
      </section>
    );
  }

  return (
    <section className="panel space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Start Interview</h2>
          <p className="mt-1 text-sm text-slate-600">Choose interview type and begin a new session.</p>
        </div>
        <Button onClick={() => setShowForm((prev) => !prev)} type="button">
          {showForm ? "Cancel" : "Start Interview"}
        </Button>
      </div>

      {showForm ? (
        <form className="space-y-4" onSubmit={handleStartSession}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="interview-type">
              Interview Type
            </label>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"
              id="interview-type"
              onChange={(event) => setType(event.target.value as InterviewType)}
              value={type}
            >
              <option value="technical">Technical Interview</option>
              <option value="hr">HR Interview</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="jd-info">
              JD Info (Optional)
            </label>
            <textarea
              className="min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              id="jd-info"
              onChange={(event) => setJdInfo(event.target.value)}
              placeholder="Paste job description, role expectations, or key requirements..."
              value={jdInfo}
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button disabled={loading} type="submit">
            {loading ? "Starting..." : "Start Session"}
          </Button>
        </form>
      ) : null}
    </section>
  );
}
