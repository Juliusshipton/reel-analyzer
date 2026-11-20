import { markTodayDone, undoTodayDone } from "@/lib/reminders/actions";
import { WEEKDAYS, formatDayList, type ReminderStatus, type WeekDayStatus } from "@/lib/reminders/days";
import { CommitmentDaysForm } from "./CommitmentDaysForm";

/**
 * Task #130: reminds the creator to work on their content on the days
 * they committed to. On a commitment day the card stays highlighted
 * until they mark the day done.
 */
export function CommitmentReminder({ status }: { status: ReminderStatus }) {
  if (!status.hasCommitment) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Commitment Reminders</h2>
        <p className="mb-5 mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Pick the days you plan to work on your content, and we&apos;ll remind you here on those days.
        </p>
        <CommitmentDaysForm defaultDays={[]} />
      </section>
    );
  }

  const tone = status.showReminder
    ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40"
    : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900";

  return (
    <section
      aria-labelledby="commitment-reminder-heading"
      className={`rounded-2xl border p-6 shadow-sm ${tone}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <h2
            id="commitment-reminder-heading"
            className="text-2xl font-bold text-zinc-900 dark:text-zinc-50"
          >
            {headline(status)}
          </h2>
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{message(status)}</p>
        </div>

        {status.isCommitmentDay && !status.doneToday && (
          <form action={markTodayDone}>
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              I worked on my content today
            </button>
          </form>
        )}
        {status.doneToday && (
          <form action={undoTodayDone}>
            <button
              type="submit"
              className="text-sm font-medium text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
            >
              Undo
            </button>
          </form>
        )}
      </div>

      <WeekStrip week={status.week} />

      <details className="mt-5 group">
        <summary className="cursor-pointer text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50">
          Change commitment days
        </summary>
        <div className="mt-4">
          <CommitmentDaysForm defaultDays={status.days} />
        </div>
      </details>
    </section>
  );
}

function headline(status: ReminderStatus): string {
  if (status.doneToday) return "Nice work today";
  if (status.isCommitmentDay) return "Today is a commitment day";
  return "Commitment Reminders";
}

function message(status: ReminderStatus): string {
  const committed = `You committed to working on ${formatDayList(status.days)}.`;
  const next = status.next
    ? `Your next commitment day is ${WEEKDAYS[status.next.weekday].long}` +
      (status.next.daysAway === 1 ? " (tomorrow)." : ` (in ${status.next.daysAway} days).`)
    : "";

  if (status.doneToday) return `You've marked today as done. ${next}`.trim();
  if (status.isCommitmentDay) {
    return `${committed} Set aside some time to keep your content moving, then mark today as done.`;
  }
  return `${committed} ${next}`.trim();
}

function WeekStrip({ week }: { week: WeekDayStatus[] }) {
  return (
    <ol aria-label="This week" className="mt-6 grid grid-cols-7 gap-2">
      {week.map((day) => {
        const { short, long } = WEEKDAYS[day.weekday];
        const state = !day.committed
          ? "rest day"
          : day.done
            ? "done"
            : day.isPast
              ? "missed"
              : day.isToday
                ? "today"
                : "upcoming";

        const styles: Record<string, string> = {
          "rest day": "border-dashed border-zinc-200 text-zinc-400 dark:border-zinc-800 dark:text-zinc-600",
          done: "border-green-600 bg-green-600 text-white",
          missed: "border-zinc-300 bg-zinc-100 text-zinc-500 line-through dark:border-zinc-700 dark:bg-zinc-800",
          today: "border-amber-500 bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50",
          upcoming: "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50",
        };

        return (
          <li
            key={day.date}
            aria-label={`${long}: ${state}`}
            className={`flex flex-col items-center rounded-lg border py-2 text-xs ${styles[state]} ${
              day.isToday ? "ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-zinc-900" : ""
            }`}
          >
            <span className="font-semibold">{short}</span>
            <span aria-hidden="true" className="mt-1 h-4 text-sm leading-4">
              {state === "done" ? "✓" : state === "rest day" ? "" : "•"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
