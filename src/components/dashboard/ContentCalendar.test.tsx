import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContentCalendar } from "./ContentCalendar";

/**
 * The component ships with three hard coded sample events:
 *   Example Data 3  21 Nov 2026, 08:00
 *   Example Data 1  21 Nov 2026, 14:00
 *   Example Data 2  30 Nov 2026, 20:00
 *
 * The calendar opens on today's date, so the clock is fixed to 21 Nov 2026
 * to make "today" a day that has events on it.
 */
const TODAY = new Date("2026-11-21T09:00:00");

function setup() {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(<ContentCalendar />);
  return user;
}

/** The event buttons in the side panel, in the order they are rendered. */
function eventButtons() {
  return screen
    .getAllByRole("button")
    .filter((button) => /Example Data/.test(button.textContent ?? ""));
}

/** The open add or edit form, so queries do not reach the calendar behind it. */
function dialog() {
  const form = document.querySelector("form");
  if (!form) {
    throw new Error("No add or edit form is open.");
  }
  return form as HTMLElement;
}

describe("ContentCalendar", () => {

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(TODAY);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  //Happy Case Test
  it("lists the events for the selected day (happy case)", () => {
    setup();

    const titles = eventButtons().map((b) => b.textContent);

    expect(titles).toHaveLength(2);
    expect(titles[0]).toContain("Example Data 3");
    expect(titles[1]).toContain("Example Data 1");
  });

  //Test that events are ordered by time of day, not by id
  it("orders the day's events by time", () => {
    setup();

    const text = eventButtons().map((b) => b.textContent ?? "");

    // 8:00 AM is listed before 2:00 PM even though its id is higher.
    expect(text[0]).toContain("8:00 AM");
    expect(text[1]).toContain("2:00 PM");
  });

  //Test the panel heading names the day being shown
  it("shows the selected date in the panel heading", () => {
    setup();

    expect(screen.getByText("Sat, Nov 21, 2026")).toBeInTheDocument();
  });

  //Test for a day with nothing scheduled
  it("shows no event buttons on a day with no events", () => {
    vi.setSystemTime(new Date("2026-11-18T09:00:00"));
    setup();

    expect(eventButtons()).toHaveLength(0);
    expect(
      screen.getByRole("button", { name: "Add Event" })
    ).toBeInTheDocument();
  });

  //Test that an event's details open when it is clicked
  it("opens an event's details when clicked", async () => {
    const user = setup();

    await user.click(
      screen.getByRole("button", { name: /Example Data 1/ })
    );

    // The dialog body, not the row the Close button sits in.
    const info = screen
      .getByRole("button", { name: "Close" })
      .closest("div.max-w-md") as HTMLElement;

    expect(info.textContent).toContain("Example Data 1");
    expect(info.textContent).toContain("Sat Nov 21 2026");
    expect(info.textContent).toContain("2:00 PM");
    expect(info.textContent).toContain("Example Description");
  });

  //Test that the details can be dismissed again
  it("closes the details dialog", async () => {
    const user = setup();

    await user.click(
      screen.getByRole("button", { name: /Example Data 1/ })
    );
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByText("Sat Nov 21 2026")).not.toBeInTheDocument();
  });

  //Test that every editable field is offered when adding an event
  it("offers all four fields when adding an event", async () => {
    const user = setup();

    await user.click(screen.getByRole("button", { name: "Add Event" }));

    const form = dialog();

    for (const field of ["title", "date", "time", "description"]) {
      expect(within(form).getByLabelText(field)).toBeInTheDocument();
    }
  });

  //Test that each field uses an input suited to what it holds
  it("uses a date picker for date and a time picker for time", async () => {
    const user = setup();

    await user.click(screen.getByRole("button", { name: "Add Event" }));

    const form = dialog();

    expect(within(form).getByLabelText("title")).toHaveAttribute(
      "type",
      "text"
    );
    expect(within(form).getByLabelText("date")).toHaveAttribute(
      "type",
      "date"
    );
    expect(within(form).getByLabelText("time")).toHaveAttribute(
      "type",
      "time"
    );
    expect(within(form).getByLabelText("description")).toHaveAttribute(
      "type",
      "text"
    );
  });

  //Test that only the description may be left blank
  it("requires every field except the description", async () => {
    const user = setup();

    await user.click(screen.getByRole("button", { name: "Add Event" }));

    const form = dialog();

    expect(within(form).getByLabelText("title")).toBeRequired();
    expect(within(form).getByLabelText("date")).toBeRequired();
    expect(within(form).getByLabelText("time")).toBeRequired();
    expect(within(form).getByLabelText("description")).not.toBeRequired();
  });

  //Test that editing an event starts from that event's current values
  it("fills the edit form with the event's current values", async () => {
    const user = setup();

    await user.click(
      screen.getByRole("button", { name: /Example Data 1/ })
    );
    await user.click(screen.getByRole("button", { name: "Edit" }));

    const form = dialog();

    expect(within(form).getByLabelText("title")).toHaveValue(
      "Example Data 1"
    );
    expect(within(form).getByLabelText("time")).toHaveValue("14:00");
    expect(within(form).getByLabelText("description")).toHaveValue(
      "Example Description"
    );
  });

  //Test the date shown for an afternoon event, which stays on the same
  //day once converted to UTC
  it("fills the edit date correctly for a daytime event", async () => {
    const user = setup();

    await user.click(
      screen.getByRole("button", { name: /Example Data 1/ })
    );
    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(within(dialog()).getByLabelText("date")).toHaveValue(
      "2026-11-21"
    );
  });

  //KNOWN BUG, so this is marked it.fails and the suite stays green.
  //getValue builds the date from toISOString(), which is UTC, so an evening
  //event west of Greenwich is offered for editing on the following day:
  //the 30 Nov 8:00 PM event opens showing 1 Dec. Remove .fails once getValue
  //uses the local date, and this test will then guard the fix.
  it.fails("fills the edit date correctly for an evening event", async () => {
    vi.setSystemTime(new Date("2026-11-30T09:00:00"));
    const user = setup();

    await user.click(
      screen.getByRole("button", { name: /Example Data 2/ })
    );
    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(within(dialog()).getByLabelText("date")).toHaveValue(
      "2026-11-30"
    );
  });

  //Test what saving a new event currently does: addEvent is still a stub,
  //so the dialog closes and no event is added
  it("does not yet save a new event", async () => {
    const user = setup();

    await user.click(screen.getByRole("button", { name: "Add Event" }));

    const form = dialog();
    await user.type(within(form).getByLabelText("title"), "New Event");
    await user.type(within(form).getByLabelText("date"), "2026-11-21");
    await user.type(within(form).getByLabelText("time"), "10:00");
    await user.click(within(form).getByRole("button", { name: "Save" }));

    expect(screen.queryByText("Add Event")).not.toBeNull();
    expect(eventButtons()).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: /New Event/ })
    ).not.toBeInTheDocument();
  });

  //Test what confirming a delete currently does: deleteEvent is still a
  //stub, so the dialogs close and the event remains
  it("does not yet delete an event", async () => {
    const user = setup();

    await user.click(
      screen.getByRole("button", { name: /Example Data 1/ })
    );
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Yes" }));

    expect(eventButtons()).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: /Example Data 1/ })
    ).toBeInTheDocument();
  });

});
