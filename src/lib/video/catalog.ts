/**
 * The sample videos available for analysis. Keys are the only values the
 * API accepts, so clients never send file paths.
 */
export const VIDEOS = {
  fitness: { label: "Fitness", src: "/fitness.mp4" },
  food: { label: "Food", src: "/food.mp4" },
} as const;

export type VideoId = keyof typeof VIDEOS;

export function isVideoId(value: unknown): value is VideoId {
  return typeof value === "string" && Object.hasOwn(VIDEOS, value);
}
