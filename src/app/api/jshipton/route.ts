import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { analyzeVideo, VideoAnalysisError } from "@/lib/claude/analyzeVideo";
import { createClient } from "@/lib/supabase/server";
import { VIDEOS, isVideoId } from "@/lib/video/catalog";
import { extractFrames } from "@/lib/video/extractFrames";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const video = body?.video;
  if (!isVideoId(video)) {
    return NextResponse.json(
      { error: `"video" must be one of: ${Object.keys(VIDEOS).join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const videoPath = path.join(process.cwd(), "public", VIDEOS[video].src);
    const frames = await extractFrames(videoPath);
    const analysis = await analyzeVideo(frames);
    return NextResponse.json({ video, analysis });
  } catch (error) {
    console.error(`Failed to analyze video "${video}":`, error);

    if (error instanceof VideoAnalysisError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Rate limited by Claude. Try again shortly." },
        { status: 429 },
      );
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: "Claude API request failed." },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { error: "Failed to analyze video." },
      { status: 500 },
    );
  }
}
