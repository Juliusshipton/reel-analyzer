import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { VideoDescriber } from "@/components/dashboard/VideoDescriber";
import { ReelsTable } from "@/components/reels/ReelsTable";
import { getReels } from "@/lib/reels/queries";
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

  const reels = await getReels();

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <DashboardHeader email={user.email} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <div className="space-y-8">
          <ReelsTable reels={reels} />
          <VideoDescriber />
        </div>
      </main>
    </div>
  );
}
