import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Backend for the Data Assistant console.
 *
 * The console posts { action, ... } and renders whatever JSON comes back.
 * The two read actions are implemented here. The three that interpret a
 * natural language prompt need the Claude client and are not wired up yet,
 * so they answer with 501 rather than failing silently.
 */

const MAX_LIMIT = 200;

type Body = {
    action?: string;
    tag?: string;
    prompt?: string;
    limit?: number | null;
    saveResults?: boolean;
};

export async function POST(request: NextRequest) {
    let body: Body;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Request body must be JSON." },
            { status: 400 }
        );
    }

    const supabase = await createClient();

    // The proxy lets /api/ through without redirecting, so this route
    // checks the session itself and answers 401 instead.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            { error: "You must be signed in to use the data assistant." },
            { status: 401 }
        );
    }

    const limit = resolveLimit(body.limit);

    switch (body.action) {
        case "fetch_user_videos":
            return fetchUserVideos(supabase, limit);

        case "find_videos_by_tag":
            return findVideosByTag(supabase, body.tag, limit);

        case "research_videos":
        case "add_training_data":
        case "custom_request":
            return NextResponse.json(
                {
                    error:
                        `The "${body.action}" action is not implemented yet. ` +
                        "It needs the Claude client, which requires CLAUDE_API_KEY, " +
                        "and research results additionally need RLS policies on the " +
                        "research tables.",
                },
                { status: 501 }
            );

        default:
            return NextResponse.json(
                { error: `Unknown action: ${body.action ?? "(none given)"}` },
                { status: 400 }
            );
    }
}

/** "All available" arrives as null; anything else is clamped to a sane range. */
function resolveLimit(value: number | null | undefined): number {
    if (value == null || !Number.isFinite(value)) {
        return MAX_LIMIT;
    }

    return Math.min(Math.max(Math.trunc(value), 1), MAX_LIMIT);
}

/**
 * Every video saved by the signed in user, newest first, with its channel
 * and its most recent statistics reading. Row level security limits the
 * rows to this user's own, so no user_id filter is needed here.
 */
async function fetchUserVideos(
    supabase: Awaited<ReturnType<typeof createClient>>,
    limit: number
) {
    const { data, error } = await supabase
        .from("user_videos")
        .select(
            `
      id,
      youtube_video_id,
      title,
      thumbnail,
      description,
      created_at,
      user_channels ( youtube_channel_id, name, subscribers ),
      user_video_statistics ( views, likes, comments, queried_at )
      `
        )
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const videos = (data ?? []).map((row) => {
        const readings = asArray(row.user_video_statistics);

        // Newest reading first, so [0] is the current figures.
        readings.sort(
            (a, b) =>
                new Date(b?.queried_at ?? 0).getTime() -
                new Date(a?.queried_at ?? 0).getTime()
        );

        const channel = asSingle(row.user_channels);

        return {
            id: row.id,
            youtube_video_id: row.youtube_video_id,
            title: row.title,
            thumbnail: row.thumbnail,
            description: row.description,
            saved_at: row.created_at,
            channel: channel
                ? {
                    youtube_channel_id: channel.youtube_channel_id,
                    name: channel.name,
                    subscribers: channel.subscribers,
                }
                : null,
            latest_statistics: readings[0] ?? null,
            statistics_readings: readings.length,
        };
    });

    return NextResponse.json({
        action: "fetch_user_videos",
        count: videos.length,
        videos,
    });
}

/**
 * The signed in user's videos carrying a given tag.
 *
 * Note: public.tags has row level security enabled with no policy, so this
 * returns nothing until a SELECT policy is added for authenticated users.
 */
async function findVideosByTag(
    supabase: Awaited<ReturnType<typeof createClient>>,
    tag: string | undefined,
    limit: number
) {
    const wanted = (tag ?? "").trim();

    if (wanted === "") {
        return NextResponse.json(
            { error: "A tag is required for this action." },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from("user_video_tags")
        .select(
            `
      confidence,
      tags!inner ( id, name ),
      user_videos!inner ( id, youtube_video_id, title, thumbnail )
      `
        )
        .eq("tags.name", wanted)
        .limit(limit);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const videos = (data ?? []).flatMap((row) => {
        const video = asSingle(row.user_videos);
        if (!video) {
            return [];
        }

        return [
            {
                id: video.id,
                youtube_video_id: video.youtube_video_id,
                title: video.title,
                thumbnail: video.thumbnail,
                confidence: row.confidence,
            },
        ];
    });

    return NextResponse.json({
        action: "find_videos_by_tag",
        tag: wanted,
        count: videos.length,
        videos,
        ...(videos.length === 0 && {
            note:
                "No matches. public.tags has row level security enabled with no " +
                "policy, so tag lookups return nothing until one is added.",
        }),
    });
}

/** PostgREST returns an embedded row as an object or a one-element array. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asArray(value: any): any[] {
    if (Array.isArray(value)) {
        return value;
    }
    return value == null ? [] : [value];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asSingle(value: any): any {
    return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}