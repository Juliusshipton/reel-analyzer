"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const apiKey = process.env.YOUTUBE_API_KEY;

export type ImportResult =
  | {
      ok: true;
      title: string;
      channel: string;
      views: string | null;
      likes: string | null;
      comments: string | null;
    }
  | { ok: false; error: string };

async function getAuthedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return { supabase, user };
}

/**
 * Pulls the 11 character video id out of any YouTube link the user might
 * paste: a normal watch URL, a share link, a Shorts link, or a bare id.
 */
export async function extractVideoId(input: string): Promise<string | null> {
  const trimmed = input.trim();

  // A bare video id.
  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  // https://youtu.be/VIDEO_ID
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return /^[\w-]{11}$/.test(id) ? id : null;
  }

  if (host !== "youtube.com" && host !== "m.youtube.com") {
    return null;
  }

  // https://www.youtube.com/watch?v=VIDEO_ID
  const fromQuery = url.searchParams.get("v");
  if (fromQuery && /^[\w-]{11}$/.test(fromQuery)) {
    return fromQuery;
  }

  // https://www.youtube.com/shorts/VIDEO_ID  and  /embed/VIDEO_ID
  const match = url.pathname.match(/^\/(?:shorts|embed|v)\/([\w-]{11})/);
  return match ? match[1] : null;
}

/**
 * Fetches a video's metadata and statistics from YouTube and stores it
 * against the signed in user: the channel, the video, and a statistics
 * row recording the counts at this moment.
 */
export async function importYouTubeVideo(
  input: string
): Promise<ImportResult> {
  if (!apiKey) {
    return { ok: false, error: "YouTube API key is not configured." };
  }

  const videoId = await extractVideoId(input);
  if (!videoId) {
    return {
      ok: false,
      error: "That does not look like a YouTube video link.",
    };
  }

  const { supabase, user } = await getAuthedClient();

  // --- Fetch the video from YouTube -------------------------------------

  const videoResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`
  );
  const videoData = await videoResponse.json();

  if (!videoResponse.ok) {
    return {
      ok: false,
      error:
        videoData?.error?.message ??
        "YouTube rejected the request for this video.",
    };
  }

  const video = videoData.items?.[0];
  if (!video) {
    return {
      ok: false,
      error: "No video was found with that link. It may be private or deleted.",
    };
  }

  const snippet = video.snippet ?? {};
  const statistics = video.statistics ?? {};

  // --- Fetch the channel, for its subscriber count ----------------------

  let subscribers: number | null = null;

  if (snippet.channelId) {
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${snippet.channelId}&key=${apiKey}`
    );
    const channelData = await channelResponse.json();

    if (channelResponse.ok) {
      const count = channelData.items?.[0]?.statistics?.subscriberCount;
      subscribers = count == null ? null : Number(count);
    }
  }

  // --- Store the channel ------------------------------------------------
  // The unique constraint on (user_id, youtube_channel_id) means importing
  // a second video from the same channel updates that row instead of
  // creating a duplicate.

  let channelRowId: number | null = null;

  if (snippet.channelId) {
    const { data: channelRow, error: channelError } = await supabase
      .from("user_channels")
      .upsert(
        {
          user_id: user.id,
          youtube_channel_id: snippet.channelId,
          name: snippet.channelTitle ?? null,
          subscribers: subscribers,
          queried_at: new Date().toISOString(),
        },
        { onConflict: "user_id,youtube_channel_id" }
      )
      .select("id")
      .single();

    if (channelError) {
      return { ok: false, error: channelError.message };
    }

    channelRowId = channelRow.id;
  }

  // --- Store the video --------------------------------------------------

  const { data: videoRow, error: videoError } = await supabase
    .from("user_videos")
    .upsert(
      {
        user_id: user.id,
        youtube_video_id: videoId,
        channel_id: channelRowId,
        title: snippet.title ?? "Untitled",
        thumbnail: snippet.thumbnails?.high?.url ?? null,
        description: snippet.description ?? null,
      },
      { onConflict: "user_id,youtube_video_id" }
    )
    .select("id")
    .single();

  if (videoError) {
    return { ok: false, error: videoError.message };
  }

  // --- Store this moment's statistics -----------------------------------
  // Inserted rather than upserted: each import adds a new reading, so the
  // table builds a history of how the video performs over time.

  const { error: statisticsError } = await supabase
    .from("user_video_statistics")
    .insert({
      user_video_id: videoRow.id,
      views: toNumber(statistics.viewCount),
      likes: toNumber(statistics.likeCount),
      comments: toNumber(statistics.commentCount),
      queried_at: new Date().toISOString(),
    });

  if (statisticsError) {
    return { ok: false, error: statisticsError.message };
  }

  refresh();

  return {
    ok: true,
    title: snippet.title ?? "Untitled",
    channel: snippet.channelTitle ?? "Unknown channel",
    views: statistics.viewCount ?? null,
    likes: statistics.likeCount ?? null,
    comments: statistics.commentCount ?? null,
  };
}

/** YouTube returns counts as strings, and hides some of them entirely. */
function toNumber(value: string | undefined): number | null {
  if (value == null) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
