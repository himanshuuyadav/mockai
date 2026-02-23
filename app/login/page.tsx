import { redirect } from "next/navigation";

import { LoginButton } from "@/components/auth/login-button";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <section className="w-full max-w-md space-y-6 rounded-2xl border bg-white p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to MockAI</h1>
          <p className="text-sm text-slate-600">
            Sign in with Google to access your interview workspace.
          </p>
        </div>
        <LoginButton />
      </section>
    </main>
  );
}
