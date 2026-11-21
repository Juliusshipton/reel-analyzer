
import { ContentCalendar } from "@/components/dashboard/ContentCalendar";
import { createClient } from "@/lib/supabase/server";
import type { CalendarEvent } from "@/types/event";
import { redirect } from "next/navigation";

export default async function CalendarPage() {
  const supabase = await createClient();

  // Get the currently authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Retrieve events belonging to this user
  const { data, error } = await supabase
    .from("calendar_events")
    .select("id, event_date, title, description")
    .eq("user_id", user.id)
    .order("event_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  // Convert Supabase records into CalendarEvent objects
  const events: CalendarEvent[] = (data ?? []).map(
    (event) => ({
      id: event.id,
      eventDate: new Date(event.event_date),
      title: event.title,
      description: event.description ?? "",
    })
  );

  return <ContentCalendar events={events} />;
}
