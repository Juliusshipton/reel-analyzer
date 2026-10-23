
export function YouTubeVideoImport() {
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
      <div className="space-y-3">
        <label
          htmlFor="youtube-url"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          YouTube Video URL
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="youtube-url"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            disabled
            className="w-full rounded-xl border-2 border-zinc-300 bg-zinc-50 px-5 py-3 text-zinc-900 outline-none placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />

          <button
            type="button"
            disabled
            className="whitespace-nowrap rounded-xl bg-red-600 px-8 py-3 font-semibold text-white opacity-60"
          >
            Import Video
          </button>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Supports standard YouTube videos and Shorts.
        </p>
      </div>

      {/* Future Statistics Preview */}
      <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-800/50">

        <div className="mb-3 text-3xl">📊</div>

        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          Your Video Statistics
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          Once you import a video, its views, likes, comments,
          and engagement rate will appear here.
        </p>

      </div>

      {/* Status */}
      <p className="mt-4 text-center text-xs text-zinc-400">
        Video importing is coming soon.
      </p>

    </section>
  );
}
