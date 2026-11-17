"use client";

import { useActionState } from "react";
import { saveCommitmentDays, type CommitmentFormState } from "@/lib/reminders/actions";
import type { Weekday } from "@/lib/reminders/days";
import { DayPicker, browserTimeZone } from "./DayPicker";

/** Lets the creator change their commitment days from the dashboard. */
export function CommitmentDaysForm({ defaultDays }: { defaultDays: readonly Weekday[] }) {
  const [state, formAction, pending] = useActionState<CommitmentFormState, FormData>(
    saveCommitmentDays,
    undefined,
  );

  return (
    <form
      // Add the browser's time zone so "today" matches where the creator is.
      action={(formData) => {
        formData.set("timeZone", browserTimeZone());
        formAction(formData);
      }}
      className="space-y-4"
    >
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Which days will you work on your content?
        </legend>
        <DayPicker defaultDays={defaultDays} />
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Clear every day to turn reminders off.
        </p>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Saving..." : "Save days"}
        </button>

        {state && "error" in state && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-400">
            {state.error}
          </p>
        )}
        {state && "success" in state && (
          <p role="status" className="text-sm text-green-700 dark:text-green-400">
            {state.success}
          </p>
        )}
      </div>
    </form>
  );
}
