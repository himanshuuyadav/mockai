import Link from "next/link";
import { redirect } from "next/navigation";

import { ResumeUploadForm } from "@/components/resume/resume-upload-form";
import { PageContainer } from "@/components/ui/page-container";
import { SectionHeader } from "@/components/ui/section-header";
import { SectionLayout } from "@/components/ui/section-layout";
import { auth } from "@/lib/auth";
import { getLatestResumeByUserId } from "@/services/resume.service";

export default async function ResumePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const latestResume = await getLatestResumeByUserId(session.user.id);

  return (
    <PageContainer className="space-y-8">
      <SectionHeader
        eyebrow="Resume"
        title="Structured resume workspace"
        description="Upload and inspect extracted signals used throughout interview rounds."
      />

      <section className="flex flex-wrap gap-3">
        {latestResume?.originalFileUrl ? (
          <>
            <a
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              href="/api/resume/latest/view"
              rel="noreferrer noopener"
              target="_blank"
            >
              View Uploaded Resume
            </a>
            <Link
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              href="#resume-upload"
            >
              Update Resume
            </Link>
          </>
        ) : (
          <Link
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            href="#resume-upload"
          >
            Upload Resume
          </Link>
        )}
      </section>

      <ResumeUploadForm />

      <SectionLayout className="grid gap-4 lg:grid-cols-3">
        <article className="panel p-5">
          <h3 className="text-base font-semibold text-slate-900">Skills</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {(latestResume?.structuredData.skills ?? []).length ? (
              latestResume?.structuredData.skills.map((skill, index) => <li key={`${skill}-${index}`}>- {skill}</li>)
            ) : (
              <li className="text-slate-500">No skills extracted yet.</li>
            )}
          </ul>
        </article>

        <article className="panel space-y-3 p-5 lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-900">Projects</h3>
          {(latestResume?.structuredData.projects ?? []).length ? (
            latestResume?.structuredData.projects.map((project, index) => (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={`${project.name}-${index}`}>
                <p className="text-sm font-semibold text-slate-900">{project.name || "Untitled Project"}</p>
                <p className="mt-1 text-sm text-slate-700">{project.description || "No description"}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Tech: {(project.tech ?? []).length ? project.tech.join(", ") : "N/A"}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No projects extracted yet.</p>
          )}
        </article>
      </SectionLayout>

      <SectionLayout className="grid gap-4 lg:grid-cols-2">
        <article className="panel p-5">
          <h3 className="text-base font-semibold text-slate-900">Achievements</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {(latestResume?.structuredData.achievements ?? []).length ? (
              latestResume?.structuredData.achievements.map((achievement, index) => (
                <li key={`${achievement}-${index}`}>- {achievement}</li>
              ))
            ) : (
              <li className="text-slate-500">No achievements extracted yet.</li>
            )}
          </ul>
        </article>

        <article className="panel space-y-3 p-5">
          <h3 className="text-base font-semibold text-slate-900">Extracurricular / Voluntary Experience</h3>
          {(latestResume?.structuredData.extracurricularExperience ?? []).length ? (
            latestResume?.structuredData.extracurricularExperience.map((item, index) => (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={`${item.activity}-${index}`}>
                <p className="text-sm font-semibold text-slate-900">{item.activity || "N/A"}</p>
                <p className="text-sm text-slate-700">{item.organization || "N/A"}</p>
                <p className="text-xs text-slate-500">{item.duration || "N/A"}</p>
                <p className="mt-2 text-sm text-slate-700">{item.description || "No description"}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No extracurricular or voluntary entries extracted yet.</p>
          )}
        </article>
      </SectionLayout>

      <article className="panel space-y-3 p-5">
        <h3 className="text-base font-semibold text-slate-900">Experience</h3>
        {(latestResume?.structuredData.experience ?? []).length ? (
          latestResume?.structuredData.experience.map((item, index) => (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={`${item.role}-${item.company}-${index}`}>
              <p className="text-sm font-semibold text-slate-900">{item.role || "N/A"}</p>
              <p className="text-sm text-slate-700">{item.company || "N/A"}</p>
              <p className="text-xs text-slate-500">{item.duration || "N/A"}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No experience extracted yet.</p>
        )}
      </article>
    </PageContainer>
  );
}
