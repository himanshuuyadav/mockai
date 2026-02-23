import Link from "next/link";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

export default async function LandingPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container flex min-h-screen flex-col justify-center gap-8 py-16">
        <div className="max-w-2xl space-y-4">
          <p className="inline-flex rounded-full bg-white px-3 py-1 text-sm text-slate-700 shadow-sm">
            MockAI SaaS
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Resume-aware AI interview practice for serious candidates.
          </h1>
          <p className="text-lg text-slate-600">
            Upload your resume, generate role-specific mock interviews, and
            track progress with actionable reports.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={session ? "/dashboard" : "/login"}>
              {session ? "Open Dashboard" : "Start With Google"}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">See Product Skeleton</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
