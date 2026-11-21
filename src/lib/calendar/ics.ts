import type { CalendarEvent } from "@/types/event";

/**
 * #131 Export Calendar — builds an iCalendar (.ics) file per RFC 5545.
 *
 * .ics imports into Google Calendar, Apple Calendar and Outlook, so the
 * schedule leaves the dashboard without anyone retyping it. Events carry no
 * end time, so each one is exported as a one hour block.
 */

const DEFAULT_DURATION_MINUTES = 60;

/** Escapes a TEXT value: backslash, semicolon, comma and newlines (RFC 5545 §3.3.11). */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/** Formats a Date as a UTC timestamp, e.g. 20261121T220000Z (RFC 5545 §3.3.5). */
function toUtcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Folds a content line to 75 octets, continuations indented by one space
 * (RFC 5545 §3.1). Measured in UTF-8 bytes, but split only between whole
 * characters so an emoji in a title is never cut in half.
 */
function fold(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) {
    return line;
  }

  const parts: string[] = [];
  let current = "";
  let currentBytes = 0;
  let limit = 75;

  for (const char of line) {
    const size = encoder.encode(char).length;
    if (currentBytes + size > limit) {
      parts.push(current);
      current = "";
      currentBytes = 0;
      limit = 74; // Continuation lines spend one octet on the leading space.
    }
    current += char;
    currentBytes += size;
  }
  if (current !== "") {
    parts.push(current);
  }

  return parts.join("\r\n ");
}

/**
 * Returns the whole calendar as .ics text.
 *
 * @param events the events to export
 * @param now    the DTSTAMP to write; injectable so tests can pin it
 */
export function buildCalendarIcs(events: CalendarEvent[], now: Date = new Date()): string {
  const stamp = toUtcStamp(now);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dialed In Solutions//Reel Analyzer Content Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Reel Analyzer Content Calendar",
  ];

  const sorted = events.toSorted(
    (a, b) => a.eventDate.getTime() - b.eventDate.getTime(),
  );

  for (const event of sorted) {
    const end = new Date(
      event.eventDate.getTime() + DEFAULT_DURATION_MINUTES * 60_000,
    );

    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.id}@reel-analyzer`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${toUtcStamp(event.eventDate)}`,
      `DTEND:${toUtcStamp(end)}`,
      `SUMMARY:${escapeText(event.title)}`,
    );

    if (event.description.trim() !== "") {
      lines.push(`DESCRIPTION:${escapeText(event.description)}`);
    }

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  // RFC 5545 requires CRLF line endings and a trailing break.
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** The download filename, e.g. content-calendar-2026-11-20.ics */
export function icsFilename(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `content-calendar-${year}-${month}-${day}.ics`;
}
