import { WEEKDAYS, type Weekday } from "@/lib/reminders/days";

/**
 * Seven toggle buttons, Sunday to Saturday, submitted as `commitmentDays`
 * (0 = Sunday ... 6 = Saturday). Used by the dashboard's commitment
 * settings, and reusable in other forms such as an onboarding survey.
 */
export function DayPicker({
  defaultDays = [],
  name = "commitmentDays",
}: {
  defaultDays?: readonly Weekday[];
  name?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {WEEKDAYS.map((day) => (
        <label key={day.value} className="cursor-pointer">
          <input
            type="checkbox"
            name={name}
            value={day.value}
            defaultChecked={defaultDays.includes(day.value)}
            className="peer sr-only"
          />
          <span
            title={day.long}
            className="flex h-10 w-12 items-center justify-center rounded-md border border-zinc-300 text-sm font-medium text-zinc-700 transition-colors peer-checked:border-zinc-900 peer-checked:bg-zinc-900 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-500 hover:bg-zinc-100 peer-checked:hover:bg-zinc-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:peer-checked:border-zinc-50 dark:peer-checked:bg-zinc-50 dark:peer-checked:text-zinc-900"
          >
            {day.short}
          </span>
        </label>
      ))}
    </div>
  );
}

/** The browser's time zone, e.g. "America/Phoenix". Call only in the browser. */
export function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
