"use client";

import { useActionState } from "react";
import { submitOnboardingSurvey } from "@/lib/onboarding/actions";
import {
  SURVEY_CONTENT_TYPES,
  SURVEY_PLATFORMS,
} from "@/lib/onboarding/constants";

export function SurveyForm() {
  const [state, formAction, pending] = useActionState(
    submitOnboardingSurvey,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-7">
      <fieldset className="space-y-3">
        <legend className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          What type of content do you want to make?
        </legend>
        {SURVEY_CONTENT_TYPES.map((contentType) => (
          <label
            key={contentType}
            className="flex cursor-pointer items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300"
          >
            <input
              type="radio"
              name="contentType"
              value={contentType}
              required
              className="size-4 accent-zinc-900 dark:accent-zinc-100"
            />
            {contentType}
          </label>
        ))}
      </fieldset>

      <div>
        <label
          htmlFor="weeklyHours"
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
        >
          How much time are you willing to invest in making this content per
          week?
        </label>
        <div className="mt-2 flex items-center gap-3">
          <input
            id="weeklyHours"
            name="weeklyHours"
            type="number"
            min="0"
            step="any"
            required
            inputMode="decimal"
            className="h-10 w-32 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            hours per week
          </span>
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          What platforms do you want to use?
        </legend>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Select all that apply.
        </p>
        {SURVEY_PLATFORMS.map((platform) => (
          <label
            key={platform}
            className="flex cursor-pointer items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300"
          >
            <input
              type="checkbox"
              name="platforms"
              value={platform}
              className="size-4 rounded accent-zinc-900 dark:accent-zinc-100"
            />
            {platform}
          </label>
        ))}
      </fieldset>

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
        className="w-full rounded-md bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Saving..." : "Continue"}
      </button>
    </form>
  );
}
