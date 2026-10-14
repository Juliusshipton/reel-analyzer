"use client";

import { useActionState } from "react";
import { signIn } from "@/lib/auth/actions";

export function AuthForm() {
  const [state, formAction, pending] = useActionState(signIn, undefined);

  return (
    <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Welcome back
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Sign in to your account to continue.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <Field
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
        />
        <Field
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
        />

        {state?.error && (
          <p
            role="alert"
            className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400"
          >
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex h-10 w-full items-center justify-center rounded-md bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  ...inputProps
}: {
  id: string;
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        required
        className="block h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-300 dark:focus:ring-zinc-300"
        {...inputProps}
      />
    </div>
  );
}
