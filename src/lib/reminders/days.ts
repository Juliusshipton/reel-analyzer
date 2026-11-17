// Day-of-week and time zone helpers for commitment-day reminders (task #130).
// Pure functions with no Supabase or Next.js imports, so both server and
// client code can use them and they are easy to test.

// Days use JavaScript's numbering (Date.getDay): 0 = Sunday ... 6 = Saturday.
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAYS: readonly { value: Weekday; short: string; long: string }[] = [
  { value: 0, short: "Sun", long: "Sunday" },
  { value: 1, short: "Mon", long: "Monday" },
  { value: 2, short: "Tue", long: "Tuesday" },
  { value: 3, short: "Wed", long: "Wednesday" },
  { value: 4, short: "Thu", long: "Thursday" },
  { value: 5, short: "Fri", long: "Friday" },
  { value: 6, short: "Sat", long: "Saturday" },
];

const SHORT_TO_WEEKDAY: Record<string, Weekday> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

/** A calendar day in the creator's time zone. `date` is YYYY-MM-DD. */
export type LocalDay = { date: string; weekday: Weekday };

/** Turns form values like ["1", "3", "3", "9"] into sorted, unique weekdays: [1, 3]. */
export function normalizeDays(values: readonly unknown[]): Weekday[] {
  const days = new Set<Weekday>();
  for (const value of values) {
    const text = typeof value === "number" ? "" : String(value ?? "").trim();
    // Skip blanks: Number("") is 0, which would wrongly count as Sunday.
    if (typeof value !== "number" && text === "") continue;
    const day = typeof value === "number" ? value : Number(text);
    if (Number.isInteger(day) && day >= 0 && day <= 6) {
      days.add(day as Weekday);
    }
  }
  return [...days].sort((a, b) => a - b);
}

/** True for an IANA time zone the runtime understands, such as "America/Phoenix". */
export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** The creator's local calendar day at `now`. */
export function localDay(now: Date, timeZone: string): LocalDay {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now);

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    weekday: SHORT_TO_WEEKDAY[get("weekday")],
  };
}

/** Adds whole days to a YYYY-MM-DD date. */
export function addDays(date: string, amount: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + amount));
  return result.toISOString().slice(0, 10);
}

/** The Sunday-to-Saturday week that contains `today`. */
export function weekContaining(today: LocalDay): LocalDay[] {
  const sunday = addDays(today.date, -today.weekday);
  return WEEKDAYS.map(({ value }) => ({ date: addDays(sunday, value), weekday: value }));
}

/**
 * The next commitment day after today, and how many days away it is.
 * Returns null when the creator has no commitment days.
 */
export function nextCommitmentDay(
  todayWeekday: Weekday,
  days: readonly Weekday[],
): { weekday: Weekday; daysAway: number } | null {
  for (let offset = 1; offset <= 7; offset++) {
    const weekday = ((todayWeekday + offset) % 7) as Weekday;
    if (days.includes(weekday)) return { weekday, daysAway: offset };
  }
  return null;
}

export type WeekDayStatus = LocalDay & {
  committed: boolean;
  done: boolean;
  isToday: boolean;
  isPast: boolean;
};

export type ReminderStatus = {
  /** False until the creator has picked at least one commitment day. */
  hasCommitment: boolean;
  days: Weekday[];
  timeZone: string;
  today: LocalDay;
  isCommitmentDay: boolean;
  doneToday: boolean;
  /** Show the reminder: today is a commitment day and it isn't marked done. */
  showReminder: boolean;
  next: { weekday: Weekday; daysAway: number } | null;
  week: WeekDayStatus[];
};

/** Works out everything the reminder card needs from the stored data. */
export function buildReminderStatus(input: {
  days: readonly Weekday[];
  timeZone: string;
  checkinDates: readonly string[];
  now: Date;
}): ReminderStatus {
  const timeZone = isValidTimeZone(input.timeZone) ? input.timeZone : "UTC";
  const days = normalizeDays(input.days);
  const today = localDay(input.now, timeZone);
  const done = new Set(input.checkinDates);

  const isCommitmentDay = days.includes(today.weekday);
  const doneToday = done.has(today.date);

  return {
    hasCommitment: days.length > 0,
    days,
    timeZone,
    today,
    isCommitmentDay,
    doneToday,
    showReminder: isCommitmentDay && !doneToday,
    next: nextCommitmentDay(today.weekday, days),
    week: weekContaining(today).map((day) => ({
      ...day,
      committed: days.includes(day.weekday),
      done: done.has(day.date),
      isToday: day.date === today.date,
      isPast: day.date < today.date,
    })),
  };
}

/** "Monday", "Monday and Thursday", "Monday, Wednesday, and Friday". */
export function formatDayList(days: readonly Weekday[]): string {
  const names = days.map((day) => WEEKDAYS[day].long);
  if (names.length <= 2) return names.join(" and ");
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}
