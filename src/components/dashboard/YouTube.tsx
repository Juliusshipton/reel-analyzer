
"use client";

import { useState } from "react";
import VideoCard from "@/components/dashboard/VideoCard";
import type { Video } from "@/types/video";
import { TOPIC_IDS } from "@/lib/video/topicId";

export function YouTubeSearch() {
  const [search, setSearch] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [eventType, setEventType] = useState('');
  const [topicId, setTopicId] = useState('');

  async function searchYouTube() {
    if (!search.trim()) return;

    setLoading(true);
    setError("");
    setVideos([]);
    setHasSearched(true);

    let searchReq = `/api/youtube?q=${encodeURIComponent(search)}`;

    if (eventType) {
      searchReq += `&eventType=${eventType}`;
    } if (topicId) {
      searchReq += `&topicId=${topicId}`;
    }

    try {
      const response = await fetch(searchReq);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setVideos(data.videos);

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Search failed"
      );
    } finally {
      setLoading(false);
    }
  }

  const sortedVideos = [...videos].sort((a, b) => {
    const viewsA = getStatistic(a.views);
    const viewsB = getStatistic(b.views);

    const likesA = getStatistic(a.likes);
    const likesB = getStatistic(b.likes);

    const commentsA = getStatistic(a.comments);
    const commentsB = getStatistic(b.comments);

    switch (sortBy) {
      case "views-desc":
        return viewsB - viewsA;

      case "views-asc":
        return viewsA - viewsB;

      case "likes-desc":
        return likesB - likesA;

      case "likes-asc":
        return likesA - likesB;

      case "comments-desc":
        return commentsB - commentsA;

      case "comments-asc":
        return commentsA - commentsB;

      case "engagement":
        const engagementA =
          viewsA > 0
            ? ((likesA + commentsA) / viewsA) * 100
            : 0;

        const engagementB =
          viewsB > 0
            ? ((likesB + commentsB) / viewsB) * 100
            : 0;

        return engagementB - engagementA;

      default:
        return 0;
    }
  });

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          YouTube Video Search
        </h2>

        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Search YouTube videos and explore their statistics.
        </p>
      </div>

      {/* Search Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          searchYouTube();
        }}
      >
        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Search YouTube videos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border-2 border-zinc-300 bg-white px-5 py-3 text-zinc-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-red-600 px-8 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="rounded-xl bg-gray-100 w-45 py-3 text-sm font-semibold cursor-pointer border border-gray-300"
          >
            {showAdvanced ? "Hide Advanced" : "Advanced Search"}
          </button>
        </div>

        {showAdvanced && (
          <div className="p-4 border border-gray-200 rounded bg-gray-50 mb-2.5 flex flex-col gap-[5px]">
            <div className="mb-2">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                Advanced Search
              </h3>
            </div>
            <div className="flex">
              <label className="w-1/4 p-2">
                Event Type:
              </label>
              <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-3/4 p-2 bg-white border border-gray-200 rounded">
                <option value="">All Event Types</option>
                <option value="completed">Completed</option>
                <option value="live">Live</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </div>
            <div className="flex">
              <label className="w-1/4 p-2">
                Topic ID:
              </label>
              <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className="w-3/4 p-2 bg-white border border-gray-200 rounded">
                <option value="">All Topic IDs</option>
                {TOPIC_IDS.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </form>

      {/* Error */}
      {error && (
        <p className="mb-6 text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <p className="text-center text-zinc-500">
          Searching YouTube...
        </p>
      )}

      {/* Results */}
      {!loading && videos.length > 0 && (
        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

            <div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Search Results
              </h3>

              <p className="text-sm text-zinc-500">
                {videos.length} videos found
              </p>
            </div>

            {/* Sorting */}
            <div className="flex items-center gap-3">
              <label
                htmlFor="sort"
                className="font-medium text-zinc-700 dark:text-zinc-300"
              >
                Sort By:
              </label>

              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border-2 border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none focus:border-red-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                <option value="default">Search Order</option>
                <option value="views-desc">Most Views</option>
                <option value="views-asc">Least Views</option>
                <option value="likes-desc">Most Likes</option>
                <option value="likes-asc">Least Likes</option>
                <option value="comments-desc">Most Comments</option>
                <option value="comments-asc">Least Comments</option>
                <option value="engagement">Highest Engagement</option>
              </select>
            </div>
          </div>

          {/* Video Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </div>
      )}

      {/* Empty Results */}
      {!loading && !error && hasSearched && videos.length === 0 && (
        <p className="text-center text-zinc-500">
          No videos found.
        </p>
      )}

      {/* Initial State */}
      {!hasSearched && !loading && (
        <p className="text-center text-zinc-500">
          Click the search button to get started.
        </p>
      )}

    </section>
  );
}

function getStatistic(
  value: string | number | null | undefined
): number {
  if (value == null || value === "") {
    return 0;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}
