
import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeVideo, VideoAnalysisError } from "./analyzeVideo";
import type { ExtractedFrames } from "@/lib/video/extractFrames";

// Stand in for the Anthropic client so no request leaves the test.
const { parse } = vi.hoisted(() => ({ parse: vi.fn() }));

vi.mock("@/lib/claude/client", () => ({
  getClaudeClient: () => ({ beta: { messages: { parse } } }),
}));

const analysis = {
  title: "Home gym tour",
  category: "fitness",
  topic: "A tour of a garage gym setup.",
  summary: "The creator walks through their equipment.",
  hook: "A wide shot of the full gym.",
  subjects: ["squat rack", "dumbbells"],
  setting: "A converted garage",
  onScreenText: ["MY HOME GYM"],
  keyMoments: [{ timestamp: 3, description: "Pans across the rack." }],
  shots: [],
  visualStyle: {
    lighting: "bright",
    colorPalette: "warm",
    editingPace: "fast" as const,
  },
  mood: "upbeat",
  targetAudience: "home gym builders",
};

function frames(count: number): ExtractedFrames {
  return {
    durationSeconds: 12.34,
    frames: Array.from({ length: count }, (_, index) => ({
      timestamp: index * 2,
      data: `base64-frame-${index}`,
    })),
  };
}

/** The content blocks sent to Claude on the most recent call. */
function sentContent() {
  return parse.mock.calls[0][0].messages[0].content;
}

describe("analyzeVideo", () => {

  beforeEach(() => {
    vi.clearAllMocks();
    parse.mockResolvedValue({ stop_reason: "end_turn", parsed_output: analysis });
  });

  //Happy Case Test
  it("returns Claude's parsed analysis (happy case)", async () => {
    const result = await analyzeVideo(frames(3));

    expect(result).toEqual(analysis);
    expect(parse).toHaveBeenCalledTimes(1);
  });

  //Test that every frame is sent, each labelled with when it occurs
  it("sends each frame with its timestamp", async () => {
    await analyzeVideo(frames(3));

    const content = sentContent();

    // Three frames: a label and an image each, then the prompt.
    expect(content).toHaveLength(7);
    expect(content[0]).toEqual({ type: "text", text: "Frame at ~0s:" });
    expect(content[2]).toEqual({ type: "text", text: "Frame at ~2s:" });
    expect(content[4]).toEqual({ type: "text", text: "Frame at ~4s:" });
  });

  //Test that frames are sent as base64 JPEGs, which is what Claude expects
  it("sends frames as base64 JPEG images", async () => {
    await analyzeVideo(frames(2));

    const content = sentContent();

    expect(content[1]).toEqual({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/jpeg",
        data: "base64-frame-0",
      },
    });
  });

  //Test that frames stay in order, since shots and key moments depend on it
  it("keeps the frames in order", async () => {
    await analyzeVideo(frames(4));

    const images = sentContent()
      .filter((block: { type: string }) => block.type === "image")
      .map((block: { source: { data: string } }) => block.source.data);

    expect(images).toEqual([
      "base64-frame-0",
      "base64-frame-1",
      "base64-frame-2",
      "base64-frame-3",
    ]);
  });

  //Test that the instructions come last, after the frames they describe
  it("puts the prompt after the frames, with the video's duration", async () => {
    await analyzeVideo(frames(3));

    const content = sentContent();
    const last = content[content.length - 1];

    expect(last.type).toBe("text");
    expect(last.text).toContain("Video duration: 12.3s.");
    expect(last.text).toContain("short-form vertical video");
  });

  //Test for handling a video Claude declines to look at
  it("fails clearly when Claude refuses", async () => {
    parse.mockResolvedValue({ stop_reason: "refusal", parsed_output: null });

    await expect(analyzeVideo(frames(2))).rejects.toThrow(VideoAnalysisError);
    await expect(analyzeVideo(frames(2))).rejects.toThrow(/declined/);
  });

  //Test for handling a reply that does not match the schema
  it("fails clearly when the reply does not match the schema", async () => {
    parse.mockResolvedValue({ stop_reason: "end_turn", parsed_output: null });

    await expect(analyzeVideo(frames(2))).rejects.toThrow(VideoAnalysisError);
    await expect(analyzeVideo(frames(2))).rejects.toThrow(/didn't match/);
  });

  //Test that a refusal is reported as a refusal even if output came back
  it("treats a refusal as a refusal even with output present", async () => {
    parse.mockResolvedValue({ stop_reason: "refusal", parsed_output: analysis });

    await expect(analyzeVideo(frames(2))).rejects.toThrow(/declined/);
  });

  //Test that a network or API failure is not swallowed
  it("passes through an error from the Claude client", async () => {
    parse.mockRejectedValue(new Error("rate limited"));

    await expect(analyzeVideo(frames(2))).rejects.toThrow("rate limited");
  });

  //Test for a video so short that no frames came back
  it("still sends the prompt when there are no frames", async () => {
    await analyzeVideo({ durationSeconds: 0.4, frames: [] });

    const content = sentContent();

    expect(content).toHaveLength(1);
    expect(content[0].text).toContain("Video duration: 0.4s.");
  });

});
