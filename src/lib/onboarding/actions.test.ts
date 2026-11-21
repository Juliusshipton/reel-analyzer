import { beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted so the vi.mock factories below can close over them.
const { mockCreateClient, mockRedirect } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockRedirect: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));
vi.mock("next/navigation", () => ({ redirect: mockRedirect }));

import { submitOnboardingSurvey } from "@/lib/onboarding/actions";

/**
 * A stand-in for the Supabase client covering only what the action touches:
 * auth.getUser() and from(...).upsert(...).
 */
function stubSupabase({
  user = { id: "user-123" } as { id: string } | null,
  upsertError = null as { message: string } | null,
} = {}) {
  const upsert = vi.fn().mockResolvedValue({ error: upsertError });
  const from = vi.fn().mockReturnValue({ upsert });
  const client = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from,
  };
  mockCreateClient.mockResolvedValue(client);
  return { client, from, upsert };
}

/** Builds a FormData the way the browser would from SurveyForm. */
function formDataOf(fields: Record<string, string | string[]>) {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      for (const item of value) formData.append(name, item);
    } else {
      formData.set(name, value);
    }
  }
  return formData;
}

const VALID = {
  contentType: "Fitness",
  weeklyHours: "5",
  platforms: ["YouTube"],
};

const INVALID_MESSAGE = "Please answer all questions with valid responses.";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("submitOnboardingSurvey", () => {
  describe("authentication", () => {
    it("asks a signed-out visitor to sign in again", async () => {
      stubSupabase({ user: null });

      const result = await submitOnboardingSurvey(
        undefined,
        formDataOf(VALID),
      );

      expect(result).toEqual({
        error: "Please sign in again to submit your survey.",
      });
    });

    it("does not write anything when signed out", async () => {
      const { upsert } = stubSupabase({ user: null });

      await submitOnboardingSurvey(undefined, formDataOf(VALID));

      expect(upsert).not.toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("validation", () => {
    it("rejects a missing weeklyHours field", async () => {
      stubSupabase();
      const formData = formDataOf(VALID);
      formData.delete("weeklyHours");

      const result = await submitOnboardingSurvey(undefined, formData);

      expect(result).toEqual({ error: INVALID_MESSAGE });
    });

    it("rejects an empty weeklyHours", async () => {
      stubSupabase();

      const result = await submitOnboardingSurvey(
        undefined,
        formDataOf({ ...VALID, weeklyHours: "" }),
      );

      expect(result).toEqual({ error: INVALID_MESSAGE });
    });

    it("rejects a whitespace-only weeklyHours", async () => {
      stubSupabase();

      const result = await submitOnboardingSurvey(
        undefined,
        formDataOf({ ...VALID, weeklyHours: "   " }),
      );

      expect(result).toEqual({ error: INVALID_MESSAGE });
    });

    it("rejects a non-numeric weeklyHours", async () => {
      stubSupabase();

      const result = await submitOnboardingSurvey(
        undefined,
        formDataOf({ ...VALID, weeklyHours: "a lot" }),
      );

      expect(result).toEqual({ error: INVALID_MESSAGE });
    });

    it("rejects a negative weeklyHours", async () => {
      stubSupabase();

      const result = await submitOnboardingSurvey(
        undefined,
        formDataOf({ ...VALID, weeklyHours: "-1" }),
      );

      expect(result).toEqual({ error: INVALID_MESSAGE });
    });

    it("rejects a content type outside the offered options", async () => {
      stubSupabase();

      const result = await submitOnboardingSurvey(
        undefined,
        formDataOf({ ...VALID, contentType: "Underwater Basket Weaving" }),
      );

      expect(result).toEqual({ error: INVALID_MESSAGE });
    });

    it("rejects a submission with no platform selected", async () => {
      stubSupabase();
      const formData = formDataOf(VALID);
      formData.delete("platforms");

      const result = await submitOnboardingSurvey(undefined, formData);

      expect(result).toEqual({ error: INVALID_MESSAGE });
    });

    it("rejects a platform outside the offered options", async () => {
      stubSupabase();

      const result = await submitOnboardingSurvey(
        undefined,
        formDataOf({ ...VALID, platforms: ["MySpace"] }),
      );

      expect(result).toEqual({ error: INVALID_MESSAGE });
    });

    it("accepts zero hours per week", async () => {
      const { upsert } = stubSupabase();

      await submitOnboardingSurvey(
        undefined,
        formDataOf({ ...VALID, weeklyHours: "0" }),
      );

      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({ weekly_hours: 0 }),
        expect.anything(),
      );
    });

    it("accepts a fractional number of hours, since the input allows any step", async () => {
      const { upsert } = stubSupabase();

      await submitOnboardingSurvey(
        undefined,
        formDataOf({ ...VALID, weeklyHours: "2.5" }),
      );

      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({ weekly_hours: 2.5 }),
        expect.anything(),
      );
    });

    it("writes nothing when validation fails", async () => {
      const { upsert } = stubSupabase();

      await submitOnboardingSurvey(
        undefined,
        formDataOf({ ...VALID, weeklyHours: "-5" }),
      );

      expect(upsert).not.toHaveBeenCalled();
    });
  });

  describe("saving a valid survey", () => {
    it("upserts the answers against the signed-in user", async () => {
      const { from, upsert } = stubSupabase({ user: { id: "user-abc" } });

      await submitOnboardingSurvey(undefined, formDataOf(VALID));

      expect(from).toHaveBeenCalledWith("user_surveys");
      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-abc",
          content_type: "Fitness",
          weekly_hours: 5,
          platforms: ["YouTube"],
        }),
        { onConflict: "user_id" },
      );
    });

    it("upserts on user_id so retaking the survey replaces the old answers", async () => {
      const { upsert } = stubSupabase();

      await submitOnboardingSurvey(undefined, formDataOf(VALID));

      expect(upsert).toHaveBeenCalledWith(expect.anything(), {
        onConflict: "user_id",
      });
    });

    it("stamps completed_at with an ISO timestamp", async () => {
      const { upsert } = stubSupabase();
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-11-20T23:30:00Z"));

      await submitOnboardingSurvey(undefined, formDataOf(VALID));

      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({ completed_at: "2026-11-20T23:30:00.000Z" }),
        expect.anything(),
      );
      vi.useRealTimers();
    });

    it("sends the user on to the dashboard", async () => {
      stubSupabase();

      await submitOnboardingSurvey(undefined, formDataOf(VALID));

      expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("when the database rejects the write", () => {
    it("surfaces the database message to the user", async () => {
      stubSupabase({ upsertError: { message: "permission denied" } });

      const result = await submitOnboardingSurvey(
        undefined,
        formDataOf(VALID),
      );

      expect(result).toEqual({
        error: "Unable to save your responses: permission denied",
      });
    });

    it("keeps the user on the survey instead of redirecting", async () => {
      stubSupabase({ upsertError: { message: "permission denied" } });

      await submitOnboardingSurvey(undefined, formDataOf(VALID));

      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });
});
