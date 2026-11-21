import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { mockSubmit } = vi.hoisted(() => ({ mockSubmit: vi.fn() }));

vi.mock("@/lib/onboarding/actions", () => ({
  submitOnboardingSurvey: mockSubmit,
}));

import { SurveyForm } from "@/components/onboarding/SurveyForm";
import {
  SURVEY_CONTENT_TYPES,
  SURVEY_PLATFORMS,
} from "@/lib/onboarding/constants";

/** The FormData the action was last called with. */
function submittedFormData(): FormData {
  const [, formData] = mockSubmit.mock.calls.at(-1)!;
  return formData as FormData;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSubmit.mockResolvedValue(undefined);
});

// vitest.config.ts does not enable globals, so Testing Library cannot register
// its own afterEach hook. Without this, renders pile up across tests.
afterEach(cleanup);

describe("SurveyForm", () => {
  describe("the questions it asks", () => {
    it("offers a radio button for every content type the app supports", () => {
      render(<SurveyForm />);

      for (const contentType of SURVEY_CONTENT_TYPES) {
        expect(
          screen.getByRole("radio", { name: contentType }),
        ).toBeInTheDocument();
      }
      expect(screen.getAllByRole("radio")).toHaveLength(
        SURVEY_CONTENT_TYPES.length,
      );
    });

    it("offers a checkbox for every supported platform", () => {
      render(<SurveyForm />);

      for (const platform of SURVEY_PLATFORMS) {
        expect(
          screen.getByRole("checkbox", { name: platform }),
        ).toBeInTheDocument();
      }
      expect(screen.getAllByRole("checkbox")).toHaveLength(
        SURVEY_PLATFORMS.length,
      );
    });

    it("asks for weekly hours as a number that cannot go below zero", () => {
      render(<SurveyForm />);

      const hours = screen.getByLabelText(/how much time/i);
      expect(hours).toHaveAttribute("type", "number");
      expect(hours).toHaveAttribute("min", "0");
    });

    it("allows fractional hours", () => {
      render(<SurveyForm />);

      expect(screen.getByLabelText(/how much time/i)).toHaveAttribute(
        "step",
        "any",
      );
    });

    it("tells the user that platforms allow more than one answer", () => {
      render(<SurveyForm />);

      expect(screen.getByText(/select all that apply/i)).toBeInTheDocument();
    });

    it("groups the content type radios under one name so only one can be picked", () => {
      render(<SurveyForm />);

      for (const radio of screen.getAllByRole("radio")) {
        expect(radio).toHaveAttribute("name", "contentType");
      }
    });
  });

  describe("submitting", () => {
    it("sends the chosen answers to the server action", async () => {
      const user = userEvent.setup();
      render(<SurveyForm />);

      await user.click(screen.getByRole("radio", { name: "Gaming" }));
      await user.type(screen.getByLabelText(/how much time/i), "7");
      await user.click(screen.getByRole("checkbox", { name: "YouTube" }));
      await user.click(screen.getByRole("button", { name: /continue/i }));

      await waitFor(() => expect(mockSubmit).toHaveBeenCalled());

      const formData = submittedFormData();
      expect(formData.get("contentType")).toBe("Gaming");
      expect(formData.get("weeklyHours")).toBe("7");
      expect(formData.getAll("platforms")).toEqual(["YouTube"]);
    });

    it("omits platforms entirely when none are ticked", async () => {
      const user = userEvent.setup();
      render(<SurveyForm />);

      await user.click(screen.getByRole("radio", { name: "Food" }));
      await user.type(screen.getByLabelText(/how much time/i), "3");
      await user.click(screen.getByRole("button", { name: /continue/i }));

      await waitFor(() => expect(mockSubmit).toHaveBeenCalled());
      expect(submittedFormData().getAll("platforms")).toEqual([]);
    });
  });

  describe("while the submission is in flight", () => {
    it("disables the button and says it is saving", async () => {
      const user = userEvent.setup();
      let release!: () => void;
      mockSubmit.mockReturnValue(
        new Promise<undefined>((resolve) => {
          release = () => resolve(undefined);
        }),
      );
      render(<SurveyForm />);

      await user.click(screen.getByRole("radio", { name: "Fitness" }));
      await user.type(screen.getByLabelText(/how much time/i), "4");
      await user.click(screen.getByRole("button", { name: /continue/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
      });

      release();
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /continue/i }),
        ).toBeEnabled();
      });
    });
  });

  describe("when the server action returns an error", () => {
    it("shows the message as an alert", async () => {
      const user = userEvent.setup();
      mockSubmit.mockResolvedValue({ error: "Unable to save your responses." });
      render(<SurveyForm />);

      await user.click(screen.getByRole("radio", { name: "Education" }));
      await user.type(screen.getByLabelText(/how much time/i), "1");
      await user.click(screen.getByRole("button", { name: /continue/i }));

      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent("Unable to save your responses.");
    });

    it("shows no alert before anything has been submitted", () => {
      render(<SurveyForm />);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("leaves the form usable so the user can correct and retry", async () => {
      const user = userEvent.setup();
      mockSubmit.mockResolvedValue({ error: "Something went wrong." });
      render(<SurveyForm />);

      await user.click(screen.getByRole("radio", { name: "Fitness" }));
      await user.type(screen.getByLabelText(/how much time/i), "2");
      await user.click(screen.getByRole("button", { name: /continue/i }));

      await screen.findByRole("alert");
      expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
    });
  });
});
