"use client";

import { useState } from "react";
import { importYouTubeVideo, type ImportResult } from "@/lib/video/actions";

export function YouTubeVideoImport() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleImport() {
    if (!url.trim() || loading) return;

    setLoading(true);
    setResult(null);

    try {
      const outcome = await importYouTubeVideo(url);
      setResult(outcome);

      if (outcome.ok) {
        setUrl("");
      }
    } catch (error) {
      setResult({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong importing that video.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">

      {/* Section Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Import YouTube Video
        </h2>

        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Add your YouTube video to track its performance and
          save its statistics to your dashboard.
        </p>
      </div>

      {/* URL Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleImport();
        }}
        className="space-y-3"
      >
        <label
          htmlFor="youtube-url"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          YouTube Video URL
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="youtube-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full rounded-xl border-2 border-zinc-300 bg-white px-5 py-3 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />

          <button
            type="submit"
            disabled={loading || url.trim() === ""}
            className="whitespace-nowrap rounded-xl bg-red-600 px-8 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Importing..." : "Import Video"}
          </button>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Supports standard YouTube videos and Shorts.
        </p>
      </form>

      {/* Failed import */}
      {result && !result.ok && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400"
        >
          {result.error}
        </div>
      )}

      {/* Imported statistics */}
      {result && result.ok ? (
        <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-800/50">

          <p className="text-xs font-semibold tracking-wide text-green-700 uppercase dark:text-green-500">
            Saved to your dashboard
          </p>

          <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {result.title}
          </h3>

          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {result.channel}
          </p>

          <dl className="mt-5 grid grid-cols-3 gap-4 text-center">
            <Statistic label="Views" value={result.views} />
            <Statistic label="Likes" value={result.likes} />
            <Statistic label="Comments" value={result.comments} />
          </dl>
        </div>
      ) : (
        !result && (
          <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-800/50">

            <div className="mb-3 text-3xl">📊</div>

            <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
              Your Video Statistics
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
              Once you import a video, its views, likes, comments
              and channel details are saved here.
            </p>
          </div>
        )
      )}

    </section>
  );
}

function Statistic({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-lg bg-white p-3 dark:bg-zinc-900">
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>

      <dd className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {value == null ? "N/A" : Number(value).toLocaleString()}
      </dd>
    </div>
  );
}
