import type { YouTubeResponse } from "@/types/video";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TOPIC_IDS } from "@/lib/video/topicId";
import { z } from "zod";

export type AutomatedSearchFrequency = "daily" | "weekly" | "monthly";

const frequencySchema = z.enum(["daily", "weekly", "monthly"]);

const filtersSchema = z.object({
  videoDuration: z.enum(["", "any", "short", "medium", "long"]),
  videoDefinition: z.enum(["", "any", "high", "standard"]),
  eventType: z.enum(["", "completed", "live", "upcoming"]),
});

const searchCategories = ["Gaming", "Food", "Fitness", "Education"] as const;
const searchCategorySchema = z.enum(searchCategories);

export type AutomatedSearchFilters = {
  videoDuration: string;
  videoDefinition: string;
  eventType: string;
};

export type AutomatedSearch = {
  category: (typeof searchCategories)[number];
  query: string;
  enabled: boolean;
  frequency: AutomatedSearchFrequency;
  filters: AutomatedSearchFilters;
};

const emptyFilters: AutomatedSearchFilters = {
  videoDuration: "",
  videoDefinition: "",
  eventType: "",
};

export const AUTOMATED_SEARCHES: AutomatedSearch[] = [
  {
    category: "Gaming",
    query: "Gaming",
    enabled: false,
    frequency: "daily",
    filters: { ...emptyFilters },
  },
  {
    category: "Food",
    query: "Food",
    enabled: false,
    frequency: "daily",
    filters: { ...emptyFilters },
  },
  {
    category: "Fitness",
    query: "Fitness",
    enabled: false,
    frequency: "daily",
    filters: { ...emptyFilters },
  },
  {
    category: "Education",
    query: "Education",
    enabled: false,
    frequency: "daily",
    filters: { ...emptyFilters },
  },
];

export async function getAutomatedSearches(): Promise<AutomatedSearch[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("automated_search_configs")
    .select("search_category, search_query, enabled, frequency, filters");

  if (error) {
    throw new Error(`Failed to load automated search settings: ${error.message}`);
  }

  const savedSearches = new Map(
    (data ?? []).map((row) => {
      const saved = z.object({
        search_category: searchCategorySchema,
        search_query: z.string().min(1),
        enabled: z.boolean(),
        frequency: frequencySchema,
        filters: filtersSchema,
      }).parse(row);

      return [saved.search_category, saved] as const;
    }),
  );

  return AUTOMATED_SEARCHES.map((search) => {
    const saved = savedSearches.get(search.category);
    if (!saved) {
      return search;
    }

    return {
      ...search,
      category: saved.search_category,
      query: saved.search_query,
      enabled: saved.enabled,
      frequency: saved.frequency,
      filters: saved.filters,
    };
  });
}

export async function runAutomatedSearch(
  search: AutomatedSearch,
  appOrigin: string,
): Promise<YouTubeResponse | null> {
  if (!search.enabled) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const url = new URL("/api/youtube", appOrigin);
  url.searchParams.set("q", search.query);

  const topicId = TOPIC_IDS.find((topic) => topic.title === search.category)?.id;
  if (topicId) {
    url.searchParams.set("topicId", topicId);
  }

  for (const [key, value] of Object.entries(search.filters)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url);
  const data = (await response.json()) as YouTubeResponse & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? `Automated search failed: ${response.status}`);
  }

  if (data.videos.length > 0) {
    const receivedAt = new Date().toISOString();
    const { error } = await createAdminClient()
      .from("automated_search_results")
      .insert(
        data.videos.map((video) => ({
          search_query: search.query,
          video_id: video.id,
          title: video.title,
          channel: video.channel,
          thumbnail: video.thumbnail,
          views: video.views,
          likes: video.likes,
          comments: video.comments,
          stored_at: receivedAt,
        })),
      );

    if (error) {
      throw new Error(`Failed to save automated search results: ${error.message}`);
    }
  }

  return data;
}

export async function runEnabledAutomatedSearches(
  appOrigin: string,
  searches?: AutomatedSearch[],
  lastRunAtByCategory: Record<string, string | undefined> = {},
  now = new Date(),
) {
  let searchesToRun = searches;
  if (!searchesToRun) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Unauthorized");
    }
    searchesToRun = await getAutomatedSearches();
  }

  const results = [];

  for (const search of searchesToRun) {
    if (
      isAutomatedSearchDue(
        search,
        lastRunAtByCategory[search.category],
        now,
      )
    ) {
      results.push({
        category: search.category,
        response: await runAutomatedSearch(search, appOrigin),
      });
    }
  }

  return results;
}

export function isAutomatedSearchDue(
  search: AutomatedSearch,
  lastRunAt?: string,
  now = new Date(),
): boolean {
  if (!search.enabled) {
    return false;
  }
  if (!lastRunAt) {
    return true;
  }

  const lastRun = new Date(lastRunAt);
  if (Number.isNaN(lastRun.getTime())) {
    throw new Error(`Invalid last-run timestamp for ${search.category}.`);
  }

  const nextRun = new Date(lastRun);
  if (search.frequency === "daily") {
    nextRun.setUTCDate(nextRun.getUTCDate() + 1);
  } else if (search.frequency === "weekly") {
    nextRun.setUTCDate(nextRun.getUTCDate() + 7);
  } else {
    const day = nextRun.getUTCDate();
    nextRun.setUTCDate(1);
    nextRun.setUTCMonth(nextRun.getUTCMonth() + 1);
    const lastDayOfMonth = new Date(
      Date.UTC(nextRun.getUTCFullYear(), nextRun.getUTCMonth() + 1, 0),
    ).getUTCDate();
    nextRun.setUTCDate(Math.min(day, lastDayOfMonth));
  }

  return now >= nextRun;
}
