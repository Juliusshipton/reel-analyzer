import { NextRequest, NextResponse } from "next/server";
import type { Video, YouTubeResponse } from "@/types/video";
// import { saveVideo } from "lib/saveVideo";

const apiKey = process.env.YOUTUBE_API_KEY;
const maxQueryLength = 500;

function errorResponse(
    message: string,
    status: number = 500,
    details?: string
) {
    return NextResponse.json(
        {
            error: message,
            ...(details && { details })
        },
        { status }
    );
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const eventType = searchParams.get("eventType");
    const videoDuration = searchParams.get("videoDuration");
    const videoDefinition = searchParams.get("videoDefinition");
    const topicId = searchParams.get("topicId");
    const category = searchParams.get("category");
    const amountRequested = 50; //This can be changed later or changed dynamically later with the user request if needed.

    if (!apiKey) {
        console.error("YOUTUBE_API_KEY is not configured");
        return errorResponse("YouTube service is not configured", 500);
    }

    if (!query?.trim()) {
        return errorResponse("Search query cannot be empty", 400);
    }

    if (query.length > maxQueryLength) {
        return errorResponse("Search query exceeds maximum length", 400);
    }

    //Values the YouTube Data API accepts for these two filters.
    const allowedDurations = ["any", "short", "medium", "long"];
    const allowedDefinitions = ["any", "high", "standard"];

    if (videoDuration && !allowedDurations.includes(videoDuration)) {
        return NextResponse.json(
            { error: "Invalid videoDuration. Use any, short, medium, or long."},
            { status: 400 }
        );
    }

    if (videoDefinition && !allowedDefinitions.includes(videoDefinition)) {
        return NextResponse.json(
            { error: "Invalid videoDefinition. Use any, high, or standard."},
            { status: 400 }
        );
    }

    let searchReq = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${amountRequested}`;

    if (videoDuration) {
        searchReq += `&videoDuration=${videoDuration}`;
    } if (videoDefinition) {
        searchReq += `&videoDefinition=${videoDefinition}`;
    } if (eventType) {
        searchReq += `&eventType=${eventType}`;
    } if (topicId) {
        searchReq += `&topicId=${topicId}`;
    } if (category) {
        searchReq += `&videoCategoryId=${category}`;
    }

    try {
        const searchResponse = await fetch(searchReq + `&key=${apiKey}`);

        if (!searchResponse.ok) {
            const errorData = await searchResponse.json().catch(() => null);
            const reason = errorData?.error?.errors?.[0]?.reason;

            console.error("YouTube API Error:", {
                status: searchResponse.status,
                reason,
                message: errorData?.error?.message
            });

            if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
                return errorResponse("YouTube API quota exceeded", 429)
            }

            if (searchResponse.status === 400) {
                return errorResponse("Invalid YouTube search request", 502)
            }

            if (searchResponse.status === 401 || searchResponse.status === 403) {
                return errorResponse("YouTube API access denied", 502);
            }

            return errorResponse("Uucommon error from YouTube API", 502)
        }

        const searchData = await searchResponse.json();

        if (!searchData.items || searchData.items.length === 0) {
            return errorResponse("No Videos Found", 404);
        }

        const allVideos: YouTubeResponse = { videos: []};

        for (const item of searchData.items) {
            const videoId = item.id.videoId;
            const currentVideo = await formatVideoData(videoId);
            allVideos.videos.push(currentVideo);


            //I commented this out so it does not constantly save videos during testing.
            //Uncomment to save everytime there is a search request.
            //await saveVideo(currentVideo);
        }

        return NextResponse.json(allVideos);


    } catch(error) {
        console.error(error);

        return errorResponse("Failed to fetch videos", 500);
    }
}

async function formatVideoData(id: string) {
    const videoResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${id}&key=${apiKey}`
    );
    const videoData = await videoResponse.json();
    const video = videoData.items[0];

    if (!video) {
        throw new Error("YouTube Search Request Failed")
    }

    const videoFormatted: Video = {
        id: video.id,
        title: video.snippet.title,
        channel: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails.high?.url ?? "",
        views: video.statistics?.viewCount ?? null,
        likes: video.statistics?.likeCount ?? null,
        comments: video.statistics?.commentCount ?? null
    };

    return videoFormatted;
}