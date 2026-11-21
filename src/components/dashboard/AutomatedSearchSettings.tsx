"use client";

import { useState, useTransition } from "react";
import type {
  AutomatedSearch,
  AutomatedSearchFilters,
  AutomatedSearchFrequency,
} from "@/lib/video/automatedSearch";
import { saveAutomatedSearches } from "@/lib/video/automatedSearchActions";

type Props = {
  searches: AutomatedSearch[];
};

const inputClassName =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white";

type FilterOption = {
  value: string;
  label: string;
};

function getFilterFields(): {
  key: keyof AutomatedSearchFilters;
  label: string;
  options: FilterOption[];
}[] {
  return [
    {
      key: "videoDuration",
      label: "Video duration",
      options: [
        { value: "", label: "All lengths" },
        { value: "any", label: "Any" },
        { value: "short", label: "Short (under 4 minutes)" },
        { value: "medium", label: "Medium (4-20 minutes)" },
        { value: "long", label: "Long (over 20 minutes)" },
      ],
    },
    {
      key: "videoDefinition",
      label: "Video definition",
      options: [
        { value: "", label: "All qualities" },
        { value: "any", label: "Any" },
        { value: "high", label: "High definition" },
        { value: "standard", label: "Standard definition" },
      ],
    },
    {
      key: "eventType",
      label: "Event type",
      options: [
        { value: "", label: "All event types" },
        { value: "completed", label: "Completed" },
        { value: "live", label: "Live" },
        { value: "upcoming", label: "Upcoming" },
      ],
    },
  ];
}

export function AutomatedSearchSettings({ searches: initialSearches }: Props) {
  const [searches, setSearches] = useState(initialSearches);
  const [message, setMessage] = useState("");
  const [saveSucceeded, setSaveSucceeded] = useState(false);
  const [isPending, startTransition] = useTransition();

  function updateSearch(index: number, patch: Partial<AutomatedSearch>) {
    setSearches((current) =>
      current.map((search, itemIndex) =>
        itemIndex === index ? { ...search, ...patch } : search,
      ),
    );
  }

  function updateFilter(
    index: number,
    key: keyof AutomatedSearchFilters,
    value: string,
  ) {
    setSearches((current) =>
      current.map((search, itemIndex) =>
        itemIndex === index
          ? { ...search, filters: { ...search.filters, [key]: value } }
          : search,
      ),
    );
  }

  function saveSettings() {
    setMessage("");
    setSaveSucceeded(false);
    startTransition(async () => {
      try {
        const result = await saveAutomatedSearches(searches);
        if (result.success) {
          setMessage(result.success);
          setSaveSucceeded(true);
        } else {
          setMessage(result.error ?? "Unable to save settings.");
        }
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Unable to save settings.",
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      {searches.map((search, index) => {
        const filterFields = getFilterFields();
        return (
        <section
          key={search.category}
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {search.category}
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Configure the query, schedule, and YouTube filters for this search.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={search.enabled}
                onChange={(event) =>
                  updateSearch(index, { enabled: event.target.checked })
                }
                className="size-4 accent-red-600"
              />
              Enabled
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Search query
              <input
                value={search.query}
                onChange={(event) =>
                  updateSearch(index, { query: event.target.value })
                }
                className={inputClassName}
                maxLength={200}
                required
              />
            </label>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Frequency
              <select
                value={search.frequency}
                onChange={(event) =>
                  updateSearch(index, {
                    frequency: event.target.value as AutomatedSearchFrequency,
                  })
                }
                className={inputClassName}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
          </div>

          <fieldset className="mt-6 border-t border-zinc-200 pt-5 dark:border-zinc-800">
            <legend className="px-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              YouTube API filters
            </legend>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filterFields.map((field) => (
                <label
                  key={field.key}
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  {field.label}
                  <select
                    value={search.filters[field.key]}
                    onChange={(event) =>
                      updateFilter(index, field.key, event.target.value)
                    }
                    className={inputClassName}
                  >
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </fieldset>
        </section>
        );
      })}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={saveSettings}
          disabled={isPending}
          className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save automated searches"}
        </button>
        {message && (
          <p
            role="status"
            className={`text-sm ${saveSucceeded ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
