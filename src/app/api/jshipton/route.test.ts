
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "./route";
import { VideoAnalysisError } from "@/lib/claude/analyzeVideo";

const { getUser, extractFrames, analyzeVideo } = vi.hoisted(() => ({
  getUser: vi.fn(),
  extractFrames: vi.fn(),
  analyzeVideo: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

vi.mock("@/lib/video/extractFrames", () => ({ extractFrames }));

// Only analyzeVideo is replaced: the route checks `instanceof
// VideoAnalysisError`, so that class has to stay the real one.
vi.mock("@/lib/claude/analyzeVideo", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/claude/analyzeVideo")>();
  return { ...actual, analyzeVideo };
});

const analysis = { title: "Home gym tour", category: "fitness" };

function request(body: unknown) {
  return new Request("http://localhost:3000/api/jshipton", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function signedIn() {
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
}

describe("POST /api/jshipton", () => {

  beforeEach(() => {
    vi.clearAllMocks();
    signedIn();
    extractFrames.mockResolvedValue({ durationSeconds: 12, frames: [] });
    analyzeVideo.mockResolvedValue(analysis);
    // The route logs failures; keep the test output readable.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  //Happy Case Test
  it("analyzes a catalogued video (happy case)", async () => {
    const response = await POST(request({ video: "fitness" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.video).toBe("fitness");
    expect(data.analysis).toEqual(analysis);
  });

  //Test that the frames go to Claude rather than the request being re-read
  it("passes the extracted frames to the analyzer", async () => {
    const frames = { durationSeconds: 8, frames: [{ timestamp: 0, data: "x" }] };
    extractFrames.mockResolvedValue(frames);

    await POST(request({ video: "food" }));

    expect(extractFrames).toHaveBeenCalledTimes(1);
    expect(extractFrames.mock.calls[0][0]).toContain("food.mp4");
    expect(analyzeVideo).toHaveBeenCalledWith(frames);
  });

  //Test that signing in is required before any work is done
  it("rejects a signed out request", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(request({ video: "fitness" }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
    expect(extractFrames).not.toHaveBeenCalled();
  });

  //Test that only catalogued videos are accepted, so no path can be passed in
  it("rejects a video that is not in the catalog", async () => {
    const response = await POST(request({ video: "travel" }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("fitness");
    expect(extractFrames).not.toHaveBeenCalled();
  });

  //Test that a file path cannot be smuggled in place of a video id
  it("rejects a file path", async () => {
    const response = await POST(request({ video: "../../etc/passwd" }));

    expect(response.status).toBe(400);
    expect(extractFrames).not.toHaveBeenCalled();
  });

  //Test for a request with no video named
  it("rejects a request with no video", async () => {
    const response = await POST(request({}));

    expect(response.status).toBe(400);
  });

  //Test for handling a body that is not JSON at all
  it("rejects a body that is not JSON", async () => {
    const response = await POST(request("this is not json"));

    expect(response.status).toBe(400);
    expect(extractFrames).not.toHaveBeenCalled();
  });

  //Test that Claude declining is reported as an upstream failure
  it("reports a refused analysis as a bad gateway", async () => {
    analyzeVideo.mockRejectedValue(
      new VideoAnalysisError("Claude declined to analyze this video."),
    );

    const response = await POST(request({ video: "fitness" }));
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.error).toBe("Claude declined to analyze this video.");
  });

  //Test that an unexpected failure does not leak its details to the client
  it("hides the detail of an unexpected failure", async () => {
    extractFrames.mockRejectedValue(
      new Error("ffmpeg: /videos/secret/path.mp4 not found"),
    );

    const response = await POST(request({ video: "fitness" }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to analyze video.");
    expect(JSON.stringify(data)).not.toContain("secret");
  });

  //Test that failures are still logged for whoever has to debug them
  it("logs an unexpected failure", async () => {
    extractFrames.mockRejectedValue(new Error("ffmpeg exploded"));

    await POST(request({ video: "fitness" }));

    expect(console.error).toHaveBeenCalled();
  });

});
