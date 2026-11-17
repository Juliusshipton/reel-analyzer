"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidTimeZone, localDay, normalizeDays } from "./days";

export type CommitmentFormState = { error: string } | { success: string } | undefined;

/** Saves the creator's commitment days (an empty list turns reminders off). */
export async function saveCommitmentDays(
  _previousState: CommitmentFormState,
  formData: FormData,
): Promise<CommitmentFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please sign in again to save your commitment days." };
  }

  const days = normalizeDays(formData.getAll("commitmentDays"));
  const timeZoneInput = String(formData.get("timeZone") ?? "");
  const timeZone = isValidTimeZone(timeZoneInput) ? timeZoneInput : "UTC";

  const { error } = await supabase.from("user_commitments").upsert(
    {
      user_id: user.id,
      days,
      time_zone: timeZone,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return { error: `Unable to save your commitment days: ${error.message}` };
  }

  revalidatePath("/dashboard");
  return {
    success: days.length > 0 ? "Commitment days saved." : "Reminders turned off.",
  };
}

/** Records that the creator worked on their content today (their local day). */
export async function markTodayDone(): Promise<void> {
  await setTodayDone(true);
}

/** Removes today's check-in, in case it was marked by mistake. */
export async function undoTodayDone(): Promise<void> {
  await setTodayDone(false);
}

async function setTodayDone(done: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // "Today" comes from the time zone saved with the creator's commitment,
  // never from the browser, so it can't be spoofed into another date.
  const { data: commitment } = await supabase
    .from("user_commitments")
    .select("time_zone")
    .eq("user_id", user.id)
    .maybeSingle();

  const timeZone = commitment && isValidTimeZone(commitment.time_zone) ? commitment.time_zone : "UTC";
  const today = localDay(new Date(), timeZone).date;

  const { error } = done
    ? await supabase
        .from("reminder_checkins")
        .upsert(
          { user_id: user.id, checkin_date: today },
          { onConflict: "user_id,checkin_date", ignoreDuplicates: true },
        )
    : await supabase
        .from("reminder_checkins")
        .delete()
        .eq("user_id", user.id)
        .eq("checkin_date", today);

  if (error) {
    throw new Error(`Unable to update today's check-in: ${error.message}`);
  }

  revalidatePath("/dashboard");
}
