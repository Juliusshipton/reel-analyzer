"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * What the calendar sends for an add or an edit.
 *
 * eventDate is an ISO string built in the browser, not a raw date + time pair.
 * The browser knows the user's real time zone; the server does not (it runs in
 * UTC on Vercel), so parsing "2026-11-21T14:00" here would shift the event.
 */
export interface CalendarEventInput {
  title: string;
  description: string;
  eventDate: string;
}

async function getAuthedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return { supabase, user };
}

function validate(input: CalendarEventInput) {
  const title = input.title.trim();
  const description = input.description.trim();
  const eventDate = new Date(input.eventDate);

  if (title === "") {
    throw new Error("Title is required.");
  }
  if (Number.isNaN(eventDate.getTime())) {
    throw new Error("Date and time are required.");
  }

  return {
    title,
    // Empty inputs are stored as null.
    description: description === "" ? null : description,
    event_date: eventDate.toISOString(),
  };
}

export async function addCalendarEvent(input: CalendarEventInput) {
  const { supabase, user } = await getAuthedClient();

  const { error } = await supabase
    .from("calendar_events")
    .insert({ user_id: user.id, ...validate(input) });

  if (error) {
    throw new Error(error.message);
  }
  refresh();
}

export async function updateCalendarEvent(id: string, input: CalendarEventInput) {
  const { supabase } = await getAuthedClient();

  const { error } = await supabase
    .from("calendar_events")
    .update(validate(input))
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
  refresh();
}

export async function deleteCalendarEvent(id: string) {
  const { supabase } = await getAuthedClient();

  const { error } = await supabase.from("calendar_events").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
  refresh();
}
