import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";

const run = promisify(execFile);

const MIN_INTERVAL_SECONDS = 2;
const MAX_FRAMES = 30;
const FRAME_WIDTH = 512;

export type Frame = {
  /** Approximate position of the frame in the video, in seconds. */
  timestamp: number;
  /** Base64-encoded JPEG data. */
  data: string;
};

export type ExtractedFrames = {
  durationSeconds: number;
  frames: Frame[];
};

function getFfmpeg() {
  if (!ffmpegPath) {
    throw new Error("ffmpeg binary is not available for this platform.");
  }
  return ffmpegPath;
}

/** Reads the duration from ffmpeg's stream info (ffmpeg-static ships no ffprobe). */
async function getDurationSeconds(videoPath: string): Promise<number> {
  // `ffmpeg -i` with no output exits non-zero but still prints stream info to stderr.
  const stderr = await run(getFfmpeg(), ["-hide_banner", "-i", videoPath]).then(
    ({ stderr }) => stderr,
    (error: { stderr?: string }) => error.stderr ?? "",
  );

  const match = stderr.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) {
    throw new Error("Could not determine video duration.");
  }
  const [, hours, minutes, seconds] = match;
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

/**
 * Samples evenly spaced frames from a video: one every 2 seconds, widened as
 * needed to stay within MAX_FRAMES, scaled down to FRAME_WIDTH.
 */
export async function extractFrames(videoPath: string): Promise<ExtractedFrames> {
  const durationSeconds = await getDurationSeconds(videoPath);
  const interval = Math.max(MIN_INTERVAL_SECONDS, durationSeconds / MAX_FRAMES);

  const outputDir = await mkdtemp(path.join(tmpdir(), "reel-frames-"));
  try {
    await run(getFfmpeg(), [
      "-hide_banner",
      "-loglevel", "error",
      "-i", videoPath,
      "-vf", `fps=1/${interval},scale=${FRAME_WIDTH}:-2`,
      "-frames:v", String(MAX_FRAMES),
      "-q:v", "4",
      path.join(outputDir, "frame_%03d.jpg"),
    ]);

    const files = (await readdir(outputDir)).filter((f) => f.endsWith(".jpg")).sort();
    const frames = await Promise.all(
      files.map(async (file, index) => ({
        timestamp: Math.round(index * interval * 10) / 10,
        data: (await readFile(path.join(outputDir, file))).toString("base64"),
      })),
    );

    return { durationSeconds, frames };
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
}
