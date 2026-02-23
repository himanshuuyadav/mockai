import { redirect } from "next/navigation";

import { ResumeUploadForm } from "@/components/resume/resume-upload-form";
import { auth } from "@/lib/auth";
import { getLatestResumeByUserId } from "@/services/resume.service";

export default async function ResumePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const latestResume = await getLatestResumeByUserId(session.user.id);

  return (
    <main className="container py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Resume Dashboard</h1>
      <p className="mt-2 text-slate-600">Upload your resume and review structured insights.</p>

      <section className="mt-8">
        <ResumeUploadForm />
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold">Skills</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {(latestResume?.structuredData.skills || []).length ? (
              latestResume?.structuredData.skills.map((skill) => <li key={skill}>• {skill}</li>)
            ) : (
              <li className="text-slate-500">No skills extracted yet.</li>
            )}
          </ul>
        </article>

        <article className="rounded-xl border bg-white p-6 md:col-span-2">
          <h2 className="text-lg font-semibold">Projects</h2>
          <div className="mt-3 space-y-3">
            {(latestResume?.structuredData.projects || []).length ? (
              latestResume?.structuredData.projects.map((project, index) => (
                <div className="rounded-md border p-3" key={`${project.name}-${index}`}>
                  <p className="font-medium">{project.name || "Untitled Project"}</p>
                  <p className="mt-1 text-sm text-slate-600">{project.description || "No description"}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Tech: {(project.tech || []).length ? project.tech.join(", ") : "N/A"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No projects extracted yet.</p>
            )}
          </div>
        </article>
      </section>

      <section className="mt-4 rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Experience</h2>
        <div className="mt-3 space-y-3">
          {(latestResume?.structuredData.experience || []).length ? (
            latestResume?.structuredData.experience.map((item, index) => (
              <div className="rounded-md border p-3" key={`${item.role}-${item.company}-${index}`}>
                <p className="font-medium">{item.role || "N/A"}</p>
                <p className="text-sm text-slate-600">{item.company || "N/A"}</p>
                <p className="text-xs text-slate-500">{item.duration || "N/A"}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No experience extracted yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
