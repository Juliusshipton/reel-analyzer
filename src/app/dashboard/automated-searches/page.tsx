import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AutomatedSearchSettings } from "@/components/dashboard/AutomatedSearchSettings";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { getAutomatedSearches } from "@/lib/video/automatedSearch";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Automated Search · Reel Analyzer",
};

export default async function AutomatedSearchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const searches = await getAutomatedSearches();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <DashboardHeader email={user.email} activeTab="automated-searches" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Automated Search
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Choose the searches to run, how often they run, and which YouTube
            filters to apply.
          </p>
        </header>
        <AutomatedSearchSettings searches={searches} />
      </main>
    </div>
  );
}
