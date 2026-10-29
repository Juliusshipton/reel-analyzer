"use client";

import { useActionState, useState } from "react";
import {
  signIn,
  signInWithGoogle,
  signUp,
} from "@/lib/auth/actions";

export function AuthForm({ authError }: { authError?: string }) {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [signInState, signInAction, signInPending] = useActionState(
    signIn,
    undefined,
  );
  const [signUpState, signUpAction, signUpPending] = useActionState(
    signUp,
    undefined,
  );
  const [googleState, googleAction, googlePending] = useActionState(
    signInWithGoogle,
    undefined,
  );
  const state = mode === "signIn" ? signInState : signUpState;
  const pending = mode === "signIn" ? signInPending : signUpPending;

  return (
    <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {mode === "signIn" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {mode === "signIn"
            ? "Sign in to your account to continue."
            : "Create an account to get started."}
        </p>
      </div>

      <form
        action={mode === "signIn" ? signInAction : signUpAction}
        className="space-y-4"
      >
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
          autoComplete={
            mode === "signIn" ? "current-password" : "new-password"
          }
        />

        {mode === "signUp" && (
          <Field
            id="confirmPassword"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
          />
        )}

        {(authError || state?.error || googleState?.error) && (
          <p
            role="alert"
            className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400"
          >
            {authError ?? state?.error ?? googleState?.error}
          </p>
        )}

        {state && "success" in state && (
          <p
            role="status"
            className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/50 dark:text-green-400"
          >
            {state.success}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex h-10 w-full items-center justify-center rounded-md bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending
            ? mode === "signIn"
              ? "Signing in…"
              : "Creating account…"
            : mode === "signIn"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        <span className="text-xs text-zinc-500 dark:text-zinc-400">or</span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <form action={googleAction}>
        <button
          type="submit"
          disabled={googlePending}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <GoogleIcon />
          {googlePending ? "Redirecting…" : "Continue with Google"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        {mode === "signIn" ? "Don’t have an account?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() =>
            setMode((currentMode) =>
              currentMode === "signIn" ? "signUp" : "signIn",
            )
          }
          className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
        >
          {mode === "signIn" ? "Create one" : "Sign in"}
        </button>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-4 w-4">
      <path
        fill="#FFC107"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"
      />
      <path
        fill="#FF3D00"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.2A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#4CAF50"
        d="M12.6 27.7a12 12 0 0 1 0-7.4v-5.2H5.8a20 20 0 0 0 0 17.8l6.8-5.2Z"
      />
      <path
        fill="#1976D2"
        d="M24 11.9c3 0 5.7 1 7.8 3.1l5.8-5.8A19.4 19.4 0 0 0 24 4 20 20 0 0 0 5.8 15.1l6.8 5.2C14.2 15.5 18.7 11.9 24 11.9Z"
      />
    </svg>
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
