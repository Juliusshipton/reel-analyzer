# Plan: Describe a Reel with Claude

## What it does
On the dashboard, pick `fitness` or `food`, hit **Describe**, and get a text description of what the video is about.

## Flow
1. **Dashboard UI** shows both videos as small previews you can click to select, plus a Describe button. It shows a loading state while waiting, then the description.
2. **`POST /api/jshipton`** with body `{ "video": "fitness" | "food" }`.
   - Returns 401 if you're not signed in (checked through Supabase), so randoms can't spend the API key.
   - Only those two names are accepted. The client never sends a file path.
3. **Extract frames** from `public/<video>.mp4` with ffmpeg:
   - 1 frame every ~2s, capped at 30 frames (fitness ≈ 12, food ≈ 30)
   - scaled to 512px wide, saved as JPEGs to a temp dir, deleted afterwards
4. **Send to Claude** in one request: all the frames (base64 images, in order, labeled with timestamps) plus a prompt like "these are frames from a short-form reel, describe what it's about." Uses the key from `CLAUDE_API_KEY`.
5. **Return** `{ "video", "analysis" }` (structured JSON, see below) and render it.

## Files
| File | What |
|---|---|
| `src/lib/video/extractFrames.ts` | ffmpeg → array of JPEG buffers |
| `src/lib/claude/client.ts` | Anthropic SDK client (reads `CLAUDE_API_KEY`) |
| `src/lib/claude/analyzeVideo.ts` | output schema, prompt, Claude call |
| `src/lib/video/catalog.ts` | allowed video IDs |
| `src/components/dashboard/VideoAnalysisResult.tsx` | renders the analysis |
| `src/app/api/jshipton/route.ts` | auth check, validation, wiring |
| `src/components/dashboard/VideoDescriber.tsx` | picker, button, result |
| `src/app/dashboard/page.tsx` | renders `VideoDescriber` |

## New deps
- `@anthropic-ai/sdk`
- `zod`: defines the output schema Claude has to follow
- `ffmpeg-static`: bundles an ffmpeg binary so it works when deployed, not just on your Mac

## Decisions I made (change any of these)
- **Visuals only.** Claude doesn't take audio, so voiceover and music are ignored.
- **Model: Claude Opus 5.5.** Best quality, about $0.03–0.10 per describe at these frame counts. Haiku 5.5 is roughly 40x cheaper if you'd rather.
- **No streaming.** Expect a 10–30s wait with a spinner, then the full text at once.
- **Rename `route.tsx` → `route.ts`.** It's a route handler with no JSX, so `.ts` is the convention.

## Resolved
- Visuals only for now, using Opus 5.5.
- The response is structured JSON, not prose: `{ video, analysis }`, where `analysis` has title, category, topic, summary, hook, subjects, setting, onScreenText, keyMoments[], shots[] (shot type, angle, movement), visualStyle, mood and targetAudience. The schema lives in `src/lib/claude/analyzeVideo.ts`.
- Just these two videos for now. Uploads get decided later.
- `/api/*` skips the proxy's login redirects; the route returns its own 401.
