import type { CalendarEvent } from "@/types/event";
import { createClient } from "@/lib/supabase/server";

/** A row of public.calendar_events, as PostgREST returns it. */
interface CalendarEventRow {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
}

/**
 * Reads the signed-in user's calendar events. Row Level Security scopes the
 * rows to the owner, so no user_id filter is needed here.
 */
export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("calendar_events")
    .select("id, title, description, event_date")
    .order("event_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  // event_date arrives as an ISO string; the component works with Date objects.
  return (data as CalendarEventRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    eventDate: new Date(row.event_date),
  }));
}
