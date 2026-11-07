
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { VideoDescriber } from "@/components/dashboard/VideoDescriber";
import { YouTubeSearch } from "@/components/dashboard/YouTube";
import { ReelsTable } from "@/components/reels/ReelsTable";
import { getReels } from "@/lib/reels/queries";
import { createClient } from "@/lib/supabase/server";
import { YouTubeVideoImport } from "@/components/dashboard/YouTubeVideoImport"
import { DatabaseConsole } from "@/components/dashboard/DatabaseConsole"

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

  // Fetch saved reels from database
  const reels = await getReels();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">

      <DashboardHeader email={user.email} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">

        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Dashboard
          </h1>

          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Research YouTube videos, explore statistics, and analyze content.
          </p>
        </header>

        <div className="space-y-12">

          {/* Interactive YouTube Search */}
          <YouTubeSearch />

          {/* Import user's video into database */}
          <YouTubeVideoImport />

          {/* Database Console */}
          <DatabaseConsole />

          {/* Saved Reels */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Saved Reels
            </h2>

            <ReelsTable reels={reels} />
          </section>

          {/* Video Analysis */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Video Analysis
            </h2>

            <VideoDescriber />
          </section>

        </div>
      </main>
    </div>
  );
}
