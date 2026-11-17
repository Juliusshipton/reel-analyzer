"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const searchCategories = ["Gaming", "Food", "Fitness", "Education"] as const;

const searchSchema = z.object({
  category: z.enum(searchCategories),
  query: z.string().trim().min(1).max(200),
  enabled: z.boolean(),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  filters: z.object({
    videoDuration: z.enum(["", "any", "short", "medium", "long"]),
    videoDefinition: z.enum(["", "any", "high", "standard"]),
    eventType: z.enum(["", "completed", "live", "upcoming"]),
  }).strict(),
}).strict();

export async function saveAutomatedSearches(input: unknown) {
  const parsed = z.array(searchSchema).safeParse(input);
  if (!parsed.success) {
    return { error: "Automated search settings are invalid. Review the fields and try again." };
  }

  const searches = parsed.data;
  if (
    searches.length !== searchCategories.length ||
    new Set(searches.map((search) => search.category)).size !==
      searchCategories.length
  ) {
    return { error: "All four automated searches must be included exactly once." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to save automated searches." };
  }

  const { error } = await supabase
    .from("automated_search_configs")
    .upsert(
      searches.map((search) => ({
        search_category: search.category,
        search_query: search.query,
        enabled: search.enabled,
        frequency: search.frequency,
        filters: search.filters,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "search_category" },
    );

  if (error) {
    return { error: `Failed to save automated search settings: ${error.message}` };
  }

  return { success: "Automated search settings saved." };
}
