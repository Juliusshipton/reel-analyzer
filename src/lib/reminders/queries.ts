import { createClient } from "@/lib/supabase/server";
import {
  buildReminderStatus,
  isValidTimeZone,
  localDay,
  weekContaining,
  type ReminderStatus,
  type Weekday,
} from "./days";

/**
 * Loads the signed-in creator's commitment days and this week's check-ins,
 * and works out whether to remind them today. Row level security limits
 * both queries to the creator's own rows.
 */
export async function getReminderStatus(now: Date = new Date()): Promise<ReminderStatus | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: commitment, error } = await supabase
    .from("user_commitments")
    .select("days, time_zone")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load commitment days: ${error.message}`);
  }

  const timeZone = commitment && isValidTimeZone(commitment.time_zone) ? commitment.time_zone : "UTC";
  const week = weekContaining(localDay(now, timeZone));

  const { data: checkins, error: checkinError } = await supabase
    .from("reminder_checkins")
    .select("checkin_date")
    .eq("user_id", user.id)
    .gte("checkin_date", week[0].date)
    .lte("checkin_date", week[6].date);

  if (checkinError) {
    throw new Error(`Unable to load reminder check-ins: ${checkinError.message}`);
  }

  return buildReminderStatus({
    days: (commitment?.days ?? []) as Weekday[],
    timeZone,
    checkinDates: (checkins ?? []).map((row) => row.checkin_date as string),
    now,
  });
}
