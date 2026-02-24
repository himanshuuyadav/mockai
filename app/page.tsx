import { LandingContent } from "@/components/marketing/landing-content";
import { auth } from "@/lib/auth";

export default async function LandingPage() {
  const session = await auth();
  return <LandingContent loggedIn={Boolean(session)} />;
}
