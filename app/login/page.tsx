import { redirect } from "next/navigation";

import { LoginButton } from "@/components/auth/login-button";
import { PageContainer } from "@/components/ui/page-container";
import { SectionHeader } from "@/components/ui/section-header";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <PageContainer className="flex min-h-screen items-center justify-center py-16">
      <section className="panel w-full max-w-lg space-y-6 p-8">
        <SectionHeader
          align="center"
          eyebrow="MockAI Access"
          title="Sign in to your interview workspace"
          description="Authenticate with Google to access resume intelligence, live mock sessions, and analytics."
        />
        <LoginButton />
      </section>
    </PageContainer>
  );
}
