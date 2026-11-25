
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

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
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <div className="space-y-10">

          {/* Welcome Section */}
          <section className="space-y-3">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
              Welcome to Your Dashboard
            </h1>

            <p className="max-w-3xl text-zinc-600 dark:text-zinc-400">
              Your AI-powered assistant for growing your social media
              presence. Research trending content, analyze video
              performance, and organize your posting schedule—all
              from one convenient dashboard.
            </p>
          </section>

          {/* Overview */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-xl font-semibold text-zinc-900 dark:text-white">
              What Can You Do?
            </h2>

            <p className="text-zinc-600 dark:text-zinc-400">
              The AI Marketing Agent is designed to help content
              creators make informed decisions about their content
              strategy. Explore popular videos, identify opportunities
              for new content, and plan future uploads based on
              insights from your research.
            </p>
          </section>

          {/* Feature Cards */}
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Explore Your Tools
            </h2>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {/* YouTube Search */}
              <Link
                href="/dashboard/youtube-search"
                className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-red-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-4 text-3xl">🔍</div>

                <h3 className="mb-2 text-lg font-semibold text-zinc-900 group-hover:text-red-600 dark:text-white">
                  YouTube Search
                </h3>

                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Discover videos related to your interests and
                  research their views, likes, comments, and
                  engagement to identify popular content.
                </p>

                <p className="mt-5 text-sm font-medium text-red-600">
                  Explore Videos →
                </p>
              </Link>

              {/* Calendar */}
              <Link
                href="/dashboard/calendar"
                className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-red-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-4 text-3xl">📅</div>

                <h3 className="mb-2 text-lg font-semibold text-zinc-900 group-hover:text-red-600 dark:text-white">
                  Content Calendar
                </h3>

                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Organize your content creation schedule.
                  Add, edit, and manage planned uploads
                  to stay consistent with your posting goals.
                </p>

                <p className="mt-5 text-sm font-medium text-red-600">
                  View Calendar →
                </p>
              </Link>

              {/* Analytics */}
              <Link
                href="/dashboard/data-assistant"
                className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-red-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-4 text-3xl">📊</div>

                <h3 className="mb-2 text-lg font-semibold text-zinc-900 group-hover:text-red-600 dark:text-white">
                  Video Analytics
                </h3>

                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Examine video performance metrics
                  and gain insights into audience engagement
                  to better understand what content works.
                </p>

                <p className="mt-5 text-sm font-medium text-red-600">
                  View Analytics →
                </p>
              </Link>
            </div>
          </section>

          {/* Future AI Features */}
          <section className="rounded-2xl border border-zinc-200 bg-zinc-100 p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-xl font-semibold text-zinc-900 dark:text-white">
              Coming Soon: AI-Powered Recommendations
            </h2>

            <p className="text-zinc-600 dark:text-zinc-400">
              We're working toward intelligent content
              recommendations that help you discover what
              to post and when. Future features will analyze
              content trends and engagement data to suggest
              potential video ideas and upload schedules
              tailored to your content strategy.
            </p>
          </section>

          {/* Footer */}
          <footer className="border-t border-zinc-200 pt-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
            AI Marketing Agent — Senior Project
          </footer>
          <DashboardHeader email={user.email} />
        </div>
      </main>
    </div>
  );
}
