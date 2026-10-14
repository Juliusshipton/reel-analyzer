import type Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { getClaudeClient } from "@/lib/claude/client";
import type { ExtractedFrames } from "@/lib/video/extractFrames";

const MODEL = "claude-opus-5-5";

export const VideoAnalysisSchema = z.object({
  title: z.string().describe("A short, descriptive title for the video."),
  category: z.string().describe("Broad content category, e.g. fitness, food, travel."),
  topic: z.string().describe("The specific subject of the video in one sentence."),
  summary: z.string().describe("2-4 sentence summary of what happens."),
  hook: z.string().describe("What the opening seconds show to grab attention."),
  subjects: z.array(z.string()).describe("Main people, objects, or food items on screen."),
  setting: z.string().describe("Where the video takes place."),
  onScreenText: z.array(z.string()).describe("Any captions or text overlays visible, verbatim."),
  keyMoments: z.array(
    z.object({
      timestamp: z.number().describe("Approximate time in seconds."),
      description: z.string(),
    }),
  ),
  shots: z.array(
    z.object({
      startTime: z.number().describe("Approximate start in seconds."),
      endTime: z.number().describe("Approximate end in seconds."),
      shotType: z.enum([
        "extreme close-up",
        "close-up",
        "medium close-up",
        "medium",
        "medium wide",
        "wide",
        "extreme wide",
        "insert/detail",
        "point of view",
      ]),
      cameraAngle: z.enum([
        "eye level",
        "high angle",
        "low angle",
        "overhead",
        "dutch angle",
        "over the shoulder",
      ]),
      cameraMovement: z.enum([
        "static",
        "handheld",
        "pan",
        "tilt",
        "tracking",
        "zoom",
        "unclear",
      ]),
      description: z.string(),
    }),
  ),
  visualStyle: z.object({
    lighting: z.string(),
    colorPalette: z.string(),
    editingPace: z.enum(["slow", "moderate", "fast"]),
  }),
  mood: z.string(),
  targetAudience: z.string(),
});

export type VideoAnalysis = z.infer<typeof VideoAnalysisSchema>;

const PROMPT = `These are frames sampled in order from a short-form vertical video (a social media reel). Each frame is labeled with its approximate timestamp. There is no audio.

Analyze the video as a whole. Shots and key moments should follow the video's actual cuts and beats as best you can infer them from the frames; timestamps are approximate because frames are sampled, not continuous. Only report on-screen text you can actually read.`;

export class VideoAnalysisError extends Error {}

export async function analyzeVideo({
  durationSeconds,
  frames,
}: ExtractedFrames): Promise<VideoAnalysis> {
  const content: Anthropic.Beta.BetaContentBlockParam[] = frames.flatMap(
    (frame) => [
      { type: "text", text: `Frame at ~${frame.timestamp}s:` },
      {
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: frame.data },
      },
    ],
  );
  content.push({
    type: "text",
    text: `${PROMPT}\n\nVideo duration: ${durationSeconds.toFixed(1)}s.`,
  });

  const response = await getClaudeClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "medium",
      format: betaZodOutputFormat(VideoAnalysisSchema),
    },
    messages: [{ role: "user", content }],
  });

  if (response.stop_reason === "refusal") {
    throw new VideoAnalysisError("Claude declined to analyze this video.");
  }
  if (!response.parsed_output) {
    throw new VideoAnalysisError("Claude returned an analysis that didn't match the expected format.");
  }
  return response.parsed_output;
}
