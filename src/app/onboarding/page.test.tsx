import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const { mockCreateClient, mockRedirect } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  // The real redirect() throws to halt rendering. Modelling that matters here,
  // because the page has code after every redirect call.
  mockRedirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));
vi.mock("next/navigation", () => ({ redirect: mockRedirect }));
vi.mock("@/components/onboarding/SurveyForm", () => ({
  SurveyForm: () => <form data-testid="survey-form" />,
}));

import OnboardingPage from "@/app/onboarding/page";

/**
 * Stands in for from("user_surveys").select(...).eq(...).maybeSingle().
 */
function stubSupabase({
  user = { id: "user-123" } as { id: string } | null,
  survey = null as { user_id: string } | null,
  error = null as { code?: string; message: string } | null,
} = {}) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: survey, error });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  mockCreateClient.mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from,
  });
  return { from, select, eq, maybeSingle };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRedirect.mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  });
});

afterEach(cleanup);

describe("OnboardingPage", () => {
  describe("when nobody is signed in", () => {
    it("sends the visitor to the landing page", async () => {
      stubSupabase({ user: null });

      await expect(OnboardingPage()).rejects.toThrow();

      expect(mockRedirect).toHaveBeenCalledWith("/");
    });

    it("does not look up a survey", async () => {
      const { from } = stubSupabase({ user: null });

      await expect(OnboardingPage()).rejects.toThrow();

      expect(from).not.toHaveBeenCalled();
    });
  });

  describe("when the survey has already been completed", () => {
    it("sends the user straight to the dashboard", async () => {
      stubSupabase({ survey: { user_id: "user-123" } });

      await expect(OnboardingPage()).rejects.toThrow();

      expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("when the survey has not been completed", () => {
    it("renders the survey form", async () => {
      stubSupabase({ survey: null });

      render(await OnboardingPage());

      expect(screen.getByTestId("survey-form")).toBeInTheDocument();
    });

    it("introduces the survey to the user", async () => {
      stubSupabase({ survey: null });

      render(await OnboardingPage());

      expect(
        screen.getByRole("heading", { name: /tell us about your content/i }),
      ).toBeInTheDocument();
    });

    it("looks the survey up by the signed-in user's id", async () => {
      const { from, select, eq } = stubSupabase({
        user: { id: "user-abc" },
        survey: null,
      });

      render(await OnboardingPage());

      expect(from).toHaveBeenCalledWith("user_surveys");
      expect(select).toHaveBeenCalledWith("user_id");
      expect(eq).toHaveBeenCalledWith("user_id", "user-abc");
    });

    it("does not redirect", async () => {
      stubSupabase({ survey: null });

      render(await OnboardingPage());

      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("when the user_surveys table is missing (PGRST205)", () => {
    it("explains that the migration needs running instead of crashing", async () => {
      stubSupabase({
        error: { code: "PGRST205", message: "Could not find the table" },
      });

      render(await OnboardingPage());

      expect(
        screen.getByRole("heading", { name: /survey database setup required/i }),
      ).toBeInTheDocument();
    });

    it("names the migration file so the reader knows what to run", async () => {
      stubSupabase({
        error: { code: "PGRST205", message: "Could not find the table" },
      });

      render(await OnboardingPage());

      expect(
        screen.getByText("src/lib/supabase/migrations/20261113_add_user_surveys.sql"),
      ).toBeInTheDocument();
    });

    it("announces the notice to assistive technology", async () => {
      stubSupabase({
        error: { code: "PGRST205", message: "Could not find the table" },
      });

      render(await OnboardingPage());

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("does not show the survey form", async () => {
      stubSupabase({
        error: { code: "PGRST205", message: "Could not find the table" },
      });

      render(await OnboardingPage());

      expect(screen.queryByTestId("survey-form")).not.toBeInTheDocument();
    });
  });

  describe("when the lookup fails for any other reason", () => {
    it("raises the error rather than hiding it behind the setup notice", async () => {
      stubSupabase({
        error: { code: "42501", message: "permission denied" },
      });

      await expect(OnboardingPage()).rejects.toThrow(
        "Unable to load onboarding survey: permission denied",
      );
    });

    it("raises an error that has no code at all", async () => {
      stubSupabase({ error: { message: "network unreachable" } });

      await expect(OnboardingPage()).rejects.toThrow(
        "Unable to load onboarding survey: network unreachable",
      );
    });
  });
});
