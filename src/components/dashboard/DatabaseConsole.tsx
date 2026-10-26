
"use client";

import { useState } from "react";

const API_URL = "/api/database"

type Action =
  | "fetch_user_videos"
  | "find_videos_by_tag"
  | "research_videos"
  | "add_training_data"
  | "custom_request";

const actions: { value: Action; label: string }[] = [
  { value: "fetch_user_videos", label: "Fetch all user videos" },
  { value: "find_videos_by_tag", label: "Find videos by tag" },
  { value: "research_videos", label: "Research new videos" },
  { value: "add_training_data", label: "Add training data" },
  { value: "custom_request", label: "Custom request" },
];

const descriptions: Record<Action, string> = {
  fetch_user_videos:
    "View videos and related data already saved in the database.",
  find_videos_by_tag:
    "Find saved videos associated with a particular tag.",
  research_videos:
    "Ask the research agent to discover videos and collect statistics.",
  add_training_data:
    "Describe new information you want added to the database.",
  custom_request:
    "Ask the data assistant to perform a custom operation.",
};

const inputStyle =
  "w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 " +
  "text-sm text-zinc-900 outline-none transition " +
  "focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 " +
  "dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 " +
  "dark:focus:border-zinc-500 dark:focus:ring-zinc-800";

export function DatabaseConsole() {
  const [action, setAction] = useState<Action>("fetch_user_videos");
  const [tag, setTag] = useState("");
  const [prompt, setPrompt] = useState("");
  const [limit, setLimit] = useState("25");
  const [saveResults, setSaveResults] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");

  const usesPrompt = [
    "research_videos",
    "add_training_data",
    "custom_request",
  ].includes(action);

  const usesLimit = [
    "fetch_user_videos",
    "find_videos_by_tag",
    "research_videos",
  ].includes(action);

  const canSubmit =
    !loading &&
    (action !== "find_videos_by_tag" || tag.trim() !== "") &&
    (!usesPrompt || prompt.trim() !== "");

  function changeAction(value: Action) {
    setAction(value);
    setResult(null);
    setError("");
  }

  async function submitRequest() {
    if (!canSubmit) return;

    setLoading(true);
    setError("");
    setResult(null);

    const body = {
      action,
      ...(action === "find_videos_by_tag" && {
        tag: tag.trim(),
      }),
      ...(usesPrompt && {
        prompt: prompt.trim(),
      }),
      ...(usesLimit && {
        limit: limit === "all" ? null : Number(limit),
      }),
      ...(action === "research_videos" && {
        saveResults,
      }),
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `Request failed: ${response.status}`
        );
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Data Assistant
          </h2>

          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Explore, collect, and manage your marketing data.
          </p>
        </div>

        <span className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          Internal Tool
        </span>
      </div>

      {/* Action selector */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          What would you like to do?
        </label>

        <div className="grid gap-2 sm:grid-cols-2">
          {actions.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => changeAction(item.value)}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                action === item.value
                  ? "border-zinc-900 bg-zinc-100 font-semibold text-zinc-900 dark:border-zinc-400 dark:bg-zinc-800 dark:text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-zinc-200 pt-5 dark:border-zinc-800">
        <p className="mb-5 text-sm text-zinc-600 dark:text-zinc-400">
          {descriptions[action]}
        </p>

        <div className="space-y-5">
          {/* Tag search */}
          {action === "find_videos_by_tag" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Video Tag
              </label>

              <input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g. fitness, gaming, climbing"
                className={inputStyle}
              />
            </div>
          )}

          {/* Natural language requests */}
          {usesPrompt && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {action === "research_videos"
                  ? "What should the agent research?"
                  : action === "add_training_data"
                  ? "What data would you like to add?"
                  : "Describe your request"}
              </label>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                placeholder={
                  action === "research_videos"
                    ? "Find popular YouTube Shorts about climbing and collect their views, likes, and comments."
                    : action === "add_training_data"
                    ? "Add a video about beginner climbing techniques with the tags fitness and climbing."
                    : "Find my highest engagement videos and compare their tags."
                }
                className={`${inputStyle} resize-y`}
              />
            </div>
          )}

          {/* Result count */}
          {usesLimit && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {action === "research_videos"
                  ? "Videos to research"
                  : "Results to retrieve"}
              </label>

              <select
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className={inputStyle}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                {action !== "research_videos" && (
                  <option value="all">All available</option>
                )}
              </select>
            </div>
          )}

          {/* Research persistence option */}
          {action === "research_videos" && (
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <input
                type="checkbox"
                checked={saveResults}
                onChange={(e) => setSaveResults(e.target.checked)}
                className="h-4 w-4 accent-zinc-900"
              />
              <div>
                <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Save results to database
                </span>
                <span className="text-xs text-zinc-500">
                  Request that the backend stores discovered videos.
                </span>
              </div>
            </label>
          )}
        </div>
      </div>

      {/* Submit */}
      <button
        type="button"
        disabled={!canSubmit}
        onClick={submitRequest}
        className="w-full rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {loading
          ? "Processing Request..."
          : action === "fetch_user_videos"
          ? "Fetch Videos"
          : action === "find_videos_by_tag"
          ? "Find Videos"
          : action === "research_videos"
          ? "Start Research"
          : action === "add_training_data"
          ? "Add Training Data"
          : "Submit Request"}
      </button>

      {/* Errors */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400"
        >
          {error}
        </div>
      )}

      {/* Response */}
      {result !== null && (
        <div className="space-y-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Results
            </h3>

            <button
              type="button"
              onClick={() =>
                navigator.clipboard.writeText(
                  JSON.stringify(result, null, 2)
                )
              }
              className="rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Copy JSON
            </button>
          </div>

          <pre className="max-h-[450px] overflow-auto rounded-xl bg-zinc-950 p-5 text-xs leading-relaxed whitespace-pre-wrap break-all text-zinc-200">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
