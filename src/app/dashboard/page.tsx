
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard · AI Marketing Agent",
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
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">

      <DashboardHeader email={user.email} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">

        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Homepage
          </h1>

          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            This is a place holder until a true homepage is built out.
          </p>
        </header>
      </main>
    </div>
  );
}
