import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";

const quickLinks = [
  { href: "/resume", title: "Resume", desc: "Upload and parse your latest resume." },
  { href: "/interview", title: "Interview", desc: "Run AI-generated mock interview sessions." },
  { href: "/report", title: "Report", desc: "Review feedback and performance trends." },
  { href: "/profile", title: "Profile", desc: "Manage account and interview preferences." },
];

export async function DashboardShell() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container py-10">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}.
            </p>
          </div>
          <LogoutButton />
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {quickLinks.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="h-full transition hover:border-primary">
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">Open {item.title} workspace</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
