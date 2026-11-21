
import { describe, it, expect } from "vitest";
import { VIDEOS, isVideoId } from "./catalog";

describe("isVideoId", () => {

  //Happy Case Test
  it("accepts the ids in the catalog (happy case)", () => {
    for (const id of Object.keys(VIDEOS)) {
      expect(isVideoId(id)).toBe(true);
    }
  });

  //Test that an unknown name is not treated as a video
  it("rejects a name that is not in the catalog", () => {
    expect(isVideoId("travel")).toBe(false);
    expect(isVideoId("")).toBe(false);
  });

  //Test that the guard is what stops a client sending a file path
  it("rejects a file path", () => {
    expect(isVideoId("/fitness.mp4")).toBe(false);
    expect(isVideoId("../../etc/passwd")).toBe(false);
  });

  //Test for values that are not strings at all
  it("rejects values that are not strings", () => {
    expect(isVideoId(undefined)).toBe(false);
    expect(isVideoId(null)).toBe(false);
    expect(isVideoId(42)).toBe(false);
    expect(isVideoId({ video: "fitness" })).toBe(false);
  });

  //Test that inherited object properties are not mistaken for videos
  it("rejects inherited Object properties", () => {
    expect(isVideoId("toString")).toBe(false);
    expect(isVideoId("constructor")).toBe(false);
  });

  //Test that every catalogued video has a label and a source file
  it("gives every video a label and a source", () => {
    for (const [id, video] of Object.entries(VIDEOS)) {
      expect(video.label, `${id} label`).toBeTruthy();
      expect(video.src, `${id} src`).toMatch(/^\/.+\.mp4$/);
    }
  });

});
