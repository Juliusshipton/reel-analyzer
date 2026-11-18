import { signOut } from "@/lib/auth/actions";
import Link from "next/link";
import type { ReactNode } from "react";

type DashboardTab = "dashboard" | "automated-searches";

export function DashboardHeader({
  email,
  activeTab = "dashboard",
}: {
  email?: string;
  activeTab?: DashboardTab;
}) {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3">
        <div className="flex flex-wrap items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            Reel Analyzer
          </Link>
          <nav aria-label="Dashboard" className="flex items-center gap-1">
            <DashboardNavLink href="/dashboard" active={activeTab === "dashboard"}>
              Dashboard
            </DashboardNavLink>
            <DashboardNavLink
              href="/dashboard/automated-searches"
              active={activeTab === "automated-searches"}
            >
              Automated Search
            </DashboardNavLink>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {email && (
            <span className="hidden text-sm text-zinc-500 sm:inline dark:text-zinc-400">
              {email}
            </span>
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

function DashboardNavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
      }`}
    >
      {children}
    </Link>
  );
}
