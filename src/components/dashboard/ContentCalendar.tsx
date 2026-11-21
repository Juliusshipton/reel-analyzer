"use client";

import { useState, useTransition } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import type { CalendarEvent } from '@/types/event';
import { EVENT_FIELDS } from "@/lib/calendar/fields";
import { addCalendarEvent, deleteCalendarEvent, updateCalendarEvent } from "@/lib/calendar/actions";
import { buildCalendarIcs, icsFilename } from "@/lib/calendar/ics";

export function ContentCalendar({ events }: { events: CalendarEvent[] }) {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent>({ id: "-1", eventDate: new Date(), title: "", description: "" });
    const [openInfo, setOpenInfo] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [openAdd, setOpenAdd] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const today = new Date();

    const handleDateChange = (value: unknown ) => {
        if (value instanceof Date) {
            setSelectedDate(value);
        } else if (Array.isArray(value) && value[0] instanceof Date) {
            setSelectedDate(value[0]);
        }
    };

    const getTileClassName = ({ date, view }: { date: Date, view: string }) => {
        if ( !(selectedDate instanceof Date) ) return null;

        const classes = ['relative', 'flex', 'flex-col', 'items-center', 'justify-center', 'hover:!bg-red-100', 'rounded-lg'];

        // Formatting for dates with events in calendar
        if (getEvents(date).length > 0) {
            classes.push(`after:content-['•']`, 'after:text-black', 'after:text-s', 'after:leading-none' );
        }

        // Formatting for selected date/month/year in Month/Year/Decade View
        if (
            ( view === 'month' && date.toDateString() === selectedDate.toDateString() ) || 
            ( view === 'year' && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear() ) ||
            ( view === 'decade' && date.getFullYear() === selectedDate.getFullYear() )
        ) {
            classes.push('!bg-red-400', '!text-white', '!font-bold', 'rounded-lg'); 
        }
        // Formatting for today's date/month/year that is not selected in Month/Year/Decade View
        else if ( 
            ( view === 'month' && date.toDateString() === today.toDateString() ) ||
            ( view === 'year' && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear() ) ||
            ( view === 'decade' && date.getFullYear() === today.getFullYear() )
        ) {
            classes.push('!bg-gray-200 rounded-lg hover:!bg-red-100'); 
        }

        return classes;
    };

    const getEvents = (date: Date) => {
        return events
        .filter( (data) => data.eventDate.toDateString() === date.toDateString() )
        .toSorted( (a, b) => a.eventDate.toTimeString().localeCompare(b.eventDate.toTimeString()) );
    }

    const getInputType = (field: string) => {
        if (field === "date") return "date";
        else if (field === "time") return "time";
        else return "text";
    }

    // Local date as YYYY-MM-DD. toISOString() would convert to UTC first, which
    // pushes an evening event to the next day in the edit form.
    const toDateInputValue = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    const getValue = (field: string) => {
        if (field === "title") return selectedEvent.title;
        else if (field === "date") return toDateInputValue(selectedEvent.eventDate);
        else if (field === "time") return selectedEvent.eventDate.toTimeString().slice(0, 5);
        else if (field === "description") return selectedEvent.description;
        else return "";
    }

    // Reads the form into the shape the server actions take. The Date is built
    // here, in the browser, because only the browser knows the user's time zone.
    const readForm = (formData: FormData) => {
        const date = String(formData.get("date") ?? "");
        const time = String(formData.get("time") ?? "");

        return {
            title: String(formData.get("title") ?? ""),
            description: String(formData.get("description") ?? ""),
            eventDate: new Date(`${date}T${time}`).toISOString(),
        };
    }

    // Server actions reject on failure, so every call goes through here: the
    // dialog only closes once the write actually landed.
    const runAction = (action: () => Promise<void>, onDone: () => void) => {
        setError(null);
        startTransition(async () => {
            try {
                await action();
                onDone();
            } catch (e) {
                setError(e instanceof Error ? e.message : "Something went wrong.");
            }
        });
    }

    const addEvent = (formData: FormData) => {
        runAction(
            () => addCalendarEvent(readForm(formData)),
            () => setOpenAdd(false),
        );
    }

    const editEvent = (formData: FormData) => {
        runAction(
            () => updateCalendarEvent(selectedEvent.id, readForm(formData)),
            () => { setOpenEdit(false); setOpenInfo(false); },
        );
    }

    const deleteEvent = () => {
        runAction(
            () => deleteCalendarEvent(selectedEvent.id),
            () => { setOpenDelete(false); setOpenEdit(false); setOpenInfo(false); },
        );
    }

    // #131 Export Calendar — hands the browser an .ics file to download.
    const exportCalendar = () => {
        const blob = new Blob([buildCalendarIcs(events)], {
            type: "text/calendar;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = icsFilename();
        link.click();
        URL.revokeObjectURL(url);
    }

    return (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">

            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    Content Creation Calendar
                </h2>
                <button
                    type="button"
                    onClick={exportCalendar}
                    disabled={events.length === 0}
                    title={events.length === 0 ? "No events to export" : "Download as .ics"}
                    className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                    Export Calendar
                </button>
            </div>

            {error && (
                <div className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
                <Calendar 
                    className="!w-full !max-w-none h-96 !rounded-2xl border !border-zinc-200 !bg-white !p-6 !shadow-sm !dark:border-zinc-800 !dark:bg-zinc-900"
                    prevLabel={<span className="text-2xl font-bold leading-none">‹</span>}
                    nextLabel={<span className="text-2xl font-bold leading-none">›</span>}
                    prev2Label={<span className="text-2xl font-bold leading-none">«</span>}
                    next2Label={<span className="text-2xl font-bold leading-none">»</span>}
                    navigationLabel={({ label }) => ( <span className="text-xl font-bold">{label}</span> )}
                    tileClassName={getTileClassName}
                    minDetail="decade"
                    calendarType="gregory"
                    defaultView="month"
                    onChange={handleDateChange} 
                    value={selectedDate}
                />

                <div className="min-w-[200px] rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <h3 className="text-l text-zinc-900 dark:text-zinc-50 text-center font-bold">
                        {selectedDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </h3>
                    <hr className="my-6 border-t border-zinc-200 dark:border-zinc-800" />
                    <div className="flex flex-col gap-2">
                        {getEvents(selectedDate).map((data) => (
                            <button
                                key={data.id}
                                type="button"
                                onClick={() => {setSelectedEvent(data); setOpenInfo(true); }}
                                className={`rounded-xl border px-4 py-3 text-left text-sm text-nowrap transition ${
                                    selectedEvent.id === data.id
                                    ? "border-zinc-900 bg-zinc-100 font-semibold text-zinc-900 dark:border-zinc-400 dark:bg-zinc-800 dark:text-white"
                                    : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                }`} 
                            >
                                {data.title}<br />
                                {data.eventDate.toLocaleTimeString('en-US', { timeStyle: 'short' })}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setOpenAdd(true)} 
                            className="rounded-xl bg-red-600 px-8 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                        >
                            Add Event
                        </button>
                    </div>

                    {openInfo && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
                            <div className="w-full max-w-md space-y-3 rounded-xl bg-white p-6 dark:bg-zinc-950">
                                <strong>{selectedEvent.title}</strong><br />
                                {selectedEvent.eventDate.toDateString()}<br />
                                {selectedEvent.eventDate.toLocaleTimeString('en-US', { timeStyle: 'short' })}<br />
                                Description: {selectedEvent.description}
                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setOpenInfo(false)}
                                        className="h-9 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:text-zinc-300"
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOpenEdit(true)}
                                        className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {openEdit && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
                            <form action={editEvent} className="w-full max-w-md space-y-3 rounded-xl bg-white p-6 dark:bg-zinc-950">
                                <h3 className="text-l text-zinc-900 dark:text-zinc-50 text-center font-bold">
                                    Edit Event
                                </h3>
                                {EVENT_FIELDS.map((field) => (
                                    <label key={field} className="block text-sm text-zinc-700 dark:text-zinc-300">
                                        {field}
                                        <input
                                            name={field}
                                            type={getInputType(field)}
                                            required = { field !== "description" }
                                            className="mt-1 block h-9 w-full rounded-md border border-zinc-300 px-3 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                                            defaultValue={getValue(field)}
                                        />
                                    </label>
                                ))}
                                <div className="flex items-center justify-between w-full pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setOpenDelete(true)}
                                        className="h-9 rounded-md bg-gray-300 px-3 text-sm font-medium dark:bg-zinc-50 dark:text-zinc-900"
                                    >
                                        Delete
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setOpenEdit(false)}
                                            className="h-9 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:text-zinc-300"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isPending}
                                            className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
                                        >
                                            {isPending ? "Saving…" : "Save"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}

                    {openDelete && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
                            <div className="w-full max-w-md space-y-3 rounded-xl bg-white p-6 dark:bg-zinc-950">
                                <h3 className="text-l text-zinc-900 dark:text-zinc-50 text-center font-bold mb-4">
                                    Are you sure you want to delete the following event?
                                </h3>
                                <strong>{selectedEvent.title}</strong><br />
                                {selectedEvent.eventDate.toDateString()}<br />
                                {selectedEvent.eventDate.toLocaleTimeString('en-US', { timeStyle: 'short' })}<br />
                                Description: {selectedEvent.description}
                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setOpenDelete(false)}
                                        className="h-9 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:text-zinc-300"
                                    >
                                        No
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => deleteEvent()}
                                        disabled={isPending}
                                        className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
                                    >
                                        {isPending ? "Deleting…" : "Yes"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {openAdd && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
                            <form action={addEvent} className="w-full max-w-md space-y-3 rounded-xl bg-white p-6 dark:bg-zinc-950">
                                <h3 className="text-l text-zinc-900 dark:text-zinc-50 text-center font-bold">
                                    Add Event
                                </h3>
                                {EVENT_FIELDS.map((field) => (
                                    <label key={field} className="block text-sm text-zinc-700 dark:text-zinc-300">
                                        {field}
                                        <input
                                            name={field}
                                            type={getInputType(field)}
                                            required = { field !== "description" }
                                            className="mt-1 block h-9 w-full rounded-md border border-zinc-300 px-3 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                                        />
                                    </label>
                                ))}
                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setOpenAdd(false)}
                                        className="h-9 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:text-zinc-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
                                    >
                                        Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                    
                </div>
            </div>
        </section>
    );
}