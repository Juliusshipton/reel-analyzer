"use client";

import { useState } from "react";
import { VideoAnalysisResult } from "@/components/dashboard/VideoAnalysisResult";
import type { VideoAnalysis } from "@/lib/claude/analyzeVideo";
import { VIDEOS, type VideoId } from "@/lib/video/catalog";

type Status =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "done"; analysis: VideoAnalysis };

const VIDEO_IDS = Object.keys(VIDEOS) as VideoId[];

export function VideoDescriber() {
  const [selected, setSelected] = useState<VideoId>(VIDEO_IDS[0]);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const loading = status.state === "loading";

  async function analyze() {
    setStatus({ state: "loading" });
    try {
      const res = await fetch("/api/jshipton", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }
      setStatus({ state: "done", analysis: data.analysis });
    } catch (error) {
      setStatus({
        state: "error",
        message: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  }

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Analyze a reel
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Pick a video and Claude will break down what it&apos;s about.
        </p>

        <div className="mt-5 flex flex-wrap gap-4">
          {VIDEO_IDS.map((id) => {
            const isSelected = id === selected;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setSelected(id);
                  setStatus({ state: "idle" });
                }}
                disabled={loading}
                aria-pressed={isSelected}
                className={`w-36 overflow-hidden rounded-xl border-2 text-left transition-colors disabled:cursor-not-allowed ${
                  isSelected
                    ? "border-zinc-900 dark:border-zinc-50"
                    : "border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <video
                  src={VIDEOS[id].src}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="metadata"
                  className="aspect-[9/16] w-full bg-zinc-100 object-cover dark:bg-zinc-900"
                />
                <span className="block px-3 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {VIDEOS[id].label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            onClick={analyze}
            disabled={loading}
            className="flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Analyzing…" : `Analyze ${VIDEOS[selected].label}`}
          </button>
          {loading && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              This usually takes 15–60 seconds.
            </span>
          )}
        </div>

        {status.state === "error" && (
          <p
            role="alert"
            className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400"
          >
            {status.message}
          </p>
        )}
      </div>

      {status.state === "done" && <VideoAnalysisResult analysis={status.analysis} />}
    </section>
  );
}
