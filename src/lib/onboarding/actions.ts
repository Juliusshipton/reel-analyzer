"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  SURVEY_CONTENT_TYPES,
  SURVEY_PLATFORMS,
} from "@/lib/onboarding/constants";
import { createClient } from "@/lib/supabase/server";

export type OnboardingSurveyState = { error: string } | undefined;

const surveySchema = z.object({
  contentType: z.enum(SURVEY_CONTENT_TYPES),
  weeklyHours: z.number().finite().nonnegative(),
  platforms: z.array(z.enum(SURVEY_PLATFORMS)).min(1),
});

export async function submitOnboardingSurvey(
  _previousState: OnboardingSurveyState,
  formData: FormData,
): Promise<OnboardingSurveyState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please sign in again to submit your survey." };
  }

  const weeklyHoursInput = formData.get("weeklyHours");
  if (
    typeof weeklyHoursInput !== "string" ||
    weeklyHoursInput.trim() === ""
  ) {
    return { error: "Please answer all questions with valid responses." };
  }

  const parsed = surveySchema.safeParse({
    contentType: formData.get("contentType"),
    weeklyHours: Number(weeklyHoursInput),
    platforms: formData.getAll("platforms"),
  });

  if (!parsed.success) {
    return { error: "Please answer all questions with valid responses." };
  }

  const { error } = await supabase.from("user_surveys").upsert(
    {
      user_id: user.id,
      content_type: parsed.data.contentType,
      weekly_hours: parsed.data.weeklyHours,
      platforms: parsed.data.platforms,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return { error: `Unable to save your responses: ${error.message}` };
  }

  redirect("/dashboard");
}
