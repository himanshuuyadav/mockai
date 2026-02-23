import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { findUserProfileById } from "@/services/user.service";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await findUserProfileById(session.user.id);

  return (
    <main className="container py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-2 text-slate-600">Manage your account and subscription details.</p>

      <section className="mt-8 grid gap-4 rounded-xl border bg-white p-6 md:grid-cols-2">
        <div>
          <p className="text-sm text-slate-500">Name</p>
          <p className="mt-1 text-base font-medium">{user?.name || "N/A"}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Email</p>
          <p className="mt-1 text-base font-medium">{user?.email || session.user.email || "N/A"}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Subscription Tier</p>
          <p className="mt-1 capitalize text-base font-medium">{user?.subscriptionTier || "free"}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Joined</p>
          <p className="mt-1 text-base font-medium">
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
          </p>
        </div>
      </section>
    </main>
  );
}
