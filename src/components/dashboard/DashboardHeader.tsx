import { signOut } from "@/lib/auth/actions";

export function DashboardHeader({ email }: { email?: string }) {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Reel Analyzer
        </span>
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
