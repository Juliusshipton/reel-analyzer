import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard · Reel Analyzer",
};

export default async function DashboardPage() {
  // The proxy redirects unauthenticated users optimistically; verify here too.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <DashboardHeader email={user.email} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
      </main>
    </div>
  );
}
