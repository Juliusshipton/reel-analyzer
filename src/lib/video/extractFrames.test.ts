
import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractFrames } from "./extractFrames";

/**
 * extractFrames shells out to ffmpeg and writes JPEGs to a temporary
 * directory. Both are replaced here so the tests exercise the sampling and
 * parsing logic without touching the disk or needing a real video.
 */
const { runFfmpeg, fs } = vi.hoisted(() => ({
  runFfmpeg: vi.fn(),
  fs: {
    mkdtemp: vi.fn(),
    readdir: vi.fn(),
    readFile: vi.fn(),
    rm: vi.fn(),
  },
}));

vi.mock("node:child_process", () => {
  const execFile = () => {};
  // promisify() returns this when the symbol is present, which is how the
  // real execFile provides its promise form too.
  (execFile as unknown as Record<symbol, unknown>)[
    Symbol.for("nodejs.util.promisify.custom")
  ] = (...args: unknown[]) => runFfmpeg(...args);
  return { execFile, default: { execFile } };
});

vi.mock("node:fs/promises", () => ({ ...fs, default: fs }));
vi.mock("node:os", () => ({ tmpdir: () => "/tmp", default: { tmpdir: () => "/tmp" } }));
vi.mock("ffmpeg-static", () => ({ default: "/fake/ffmpeg" }));

/** ffmpeg prints stream info to stderr and exits non-zero when given no output. */
function ffmpegReportsDuration(text: string) {
  runFfmpeg.mockRejectedValueOnce({ stderr: text });
}

function framesWritten(names: string[]) {
  runFfmpeg.mockResolvedValueOnce({ stdout: "", stderr: "" });
  fs.readdir.mockResolvedValue(names);
}

/** The arguments of the ffmpeg call that extracted the frames. */
function extractArgs(): string[] {
  return runFfmpeg.mock.calls[1][1];
}

describe("extractFrames", () => {

  beforeEach(() => {
    vi.clearAllMocks();
    fs.mkdtemp.mockResolvedValue("/tmp/reel-frames-abc");
    // path.join uses backslashes on Windows and forward slashes elsewhere,
    // so split on either to get the file name.
    fs.readFile.mockImplementation(async (file: string) =>
      Buffer.from(`image-of-${file.split(/[\\/]/).pop()}`),
    );
    fs.rm.mockResolvedValue(undefined);
  });

  //Happy Case Test
  it("returns the duration and the sampled frames (happy case)", async () => {
    ffmpegReportsDuration("  Duration: 00:00:12.34, start: 0.000000");
    framesWritten(["frame_001.jpg", "frame_002.jpg", "frame_003.jpg"]);

    const result = await extractFrames("/videos/fitness.mp4");

    expect(result.durationSeconds).toBeCloseTo(12.34);
    expect(result.frames).toHaveLength(3);
  });

  //Test that hours and minutes are read, not just seconds
  it("reads a duration given in hours and minutes", async () => {
    ffmpegReportsDuration("  Duration: 01:02:03.50, bitrate: 500 kb/s");
    framesWritten(["frame_001.jpg"]);

    const result = await extractFrames("/videos/long.mp4");

    expect(result.durationSeconds).toBeCloseTo(3723.5);
  });

  //Test for handling a file ffmpeg cannot read a duration from
  it("fails when the duration cannot be found", async () => {
    ffmpegReportsDuration("not a video file");

    await expect(extractFrames("/videos/broken.mp4")).rejects.toThrow(
      /Could not determine video duration/,
    );
  });

  //Test that a short reel is sampled every two seconds
  it("samples a short video every two seconds", async () => {
    ffmpegReportsDuration("  Duration: 00:00:12.00,");
    framesWritten(["frame_001.jpg", "frame_002.jpg", "frame_003.jpg"]);

    const result = await extractFrames("/videos/short.mp4");

    expect(result.frames.map((f) => f.timestamp)).toEqual([0, 2, 4]);
    expect(extractArgs()).toContain("fps=1/2,scale=512:-2");
  });

  //Test that a longer video is sampled more widely so the frame cap holds
  it("widens the interval on a longer video to stay within the cap", async () => {
    // 120s over at most 30 frames is one frame every 4 seconds.
    ffmpegReportsDuration("  Duration: 00:02:00.00,");
    framesWritten(["frame_001.jpg", "frame_002.jpg", "frame_003.jpg"]);

    const result = await extractFrames("/videos/long.mp4");

    expect(result.frames.map((f) => f.timestamp)).toEqual([0, 4, 8]);
    expect(extractArgs()).toContain("fps=1/4,scale=512:-2");
  });

  //Test that timestamps stay readable rather than running to many decimals
  it("rounds timestamps to one decimal place", async () => {
    // 93s / 30 = 3.1s between frames.
    ffmpegReportsDuration("  Duration: 00:01:33.00,");
    framesWritten(["frame_001.jpg", "frame_002.jpg", "frame_003.jpg"]);

    const result = await extractFrames("/videos/odd.mp4");

    expect(result.frames.map((f) => f.timestamp)).toEqual([0, 3.1, 6.2]);
  });

  //Test that ffmpeg is told never to write more frames than the cap
  it("caps the number of frames ffmpeg writes", async () => {
    ffmpegReportsDuration("  Duration: 00:10:00.00,");
    framesWritten(["frame_001.jpg"]);

    await extractFrames("/videos/verylong.mp4");

    const args = extractArgs();
    expect(args[args.indexOf("-frames:v") + 1]).toBe("30");
  });

  //Test that frames are returned as base64, ready to send to Claude
  it("returns each frame as base64", async () => {
    ffmpegReportsDuration("  Duration: 00:00:04.00,");
    framesWritten(["frame_001.jpg", "frame_002.jpg"]);

    const result = await extractFrames("/videos/fitness.mp4");

    expect(result.frames[0].data).toBe(
      Buffer.from("image-of-frame_001.jpg").toString("base64"),
    );
  });

  //Test that anything else left in the temporary folder is ignored
  it("ignores files that are not JPEGs", async () => {
    ffmpegReportsDuration("  Duration: 00:00:06.00,");
    framesWritten(["frame_001.jpg", "notes.txt", "frame_002.jpg"]);

    const result = await extractFrames("/videos/fitness.mp4");

    expect(result.frames).toHaveLength(2);
  });

  //Test that frames are ordered by name, so timestamps match the images
  it("orders frames by filename", async () => {
    ffmpegReportsDuration("  Duration: 00:00:06.00,");
    framesWritten(["frame_003.jpg", "frame_001.jpg", "frame_002.jpg"]);

    const result = await extractFrames("/videos/fitness.mp4");

    expect(result.frames.map((f) => f.data)).toEqual([
      Buffer.from("image-of-frame_001.jpg").toString("base64"),
      Buffer.from("image-of-frame_002.jpg").toString("base64"),
      Buffer.from("image-of-frame_003.jpg").toString("base64"),
    ]);
  });

  //Test that the temporary folder does not pile up on disk
  it("removes the temporary folder when it finishes", async () => {
    ffmpegReportsDuration("  Duration: 00:00:04.00,");
    framesWritten(["frame_001.jpg"]);

    await extractFrames("/videos/fitness.mp4");

    expect(fs.rm).toHaveBeenCalledWith("/tmp/reel-frames-abc", {
      recursive: true,
      force: true,
    });
  });

  //Test that it is cleaned up even when extraction fails part way
  it("removes the temporary folder even when ffmpeg fails", async () => {
    ffmpegReportsDuration("  Duration: 00:00:04.00,");
    runFfmpeg.mockRejectedValueOnce(new Error("ffmpeg exploded"));

    await expect(extractFrames("/videos/fitness.mp4")).rejects.toThrow(
      "ffmpeg exploded",
    );
    expect(fs.rm).toHaveBeenCalledWith("/tmp/reel-frames-abc", {
      recursive: true,
      force: true,
    });
  });

});
