import type { YouTubeResponse } from "@/types/video";

export type AutomatedSearchFrequency = "daily" | "weekly" | "monthly";

export type AutomatedSearchFilters = {
  videoDuration: string;
  videoDefinition: string;
  eventType: string;
  topicId: string;
  category: string;
};

export type AutomatedSearch = {
  category: string;
  query: string;
  enabled: boolean;
  frequency: AutomatedSearchFrequency;
  filters: AutomatedSearchFilters;
};

const emptyFilters: AutomatedSearchFilters = {
  videoDuration: "",
  videoDefinition: "",
  eventType: "",
  topicId: "",
  category: "",
};

export const AUTOMATED_SEARCHES: AutomatedSearch[] = [
  {
    category: "Gaming",
    query: "Gaming",
    enabled: false,
    frequency: "daily",
    filters: { ...emptyFilters, topicId: "/m/0bzvm2" },
  },
  {
    category: "Food",
    query: "Food",
    enabled: false,
    frequency: "daily",
    filters: { ...emptyFilters, topicId: "/m/02wbm" },
  },
  {
    category: "Fitness",
    query: "Fitness",
    enabled: false,
    frequency: "daily",
    filters: { ...emptyFilters, topicId: "/m/027x7n" },
  },
  {
    category: "Education",
    query: "Education",
    enabled: false,
    frequency: "daily",
    filters: { ...emptyFilters },
  },
];

export async function runAutomatedSearch(
  search: AutomatedSearch,
  appOrigin: string,
): Promise<YouTubeResponse | null> {
  if (!search.enabled) {
    return null;
  }

  const url = new URL("/api/youtube", appOrigin);
  url.searchParams.set("q", search.query);

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

  return data;
}

export async function runEnabledAutomatedSearches(
  appOrigin: string,
  searches: AutomatedSearch[] = AUTOMATED_SEARCHES,
  lastRunAtByCategory: Record<string, string | undefined> = {},
  now = new Date(),
) {
  const results = [];

  for (const search of searches) {
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
