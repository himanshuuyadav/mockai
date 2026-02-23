import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { FEATURE_ROUTES } from "@/utils/constants";

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
          {FEATURE_ROUTES.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="h-full transition hover:border-primary">
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.dashboardDescription}</CardDescription>
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
