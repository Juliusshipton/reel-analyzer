"use client";

import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import type { CalendarEvent } from '@/types/event';
import { EVENT_FIELDS } from "@/lib/calendar/fields";

export function ContentCalendar() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    // TODO: implement persistent data storage
    const [calendarData, setCalendarData] = useState<CalendarEvent[]>([
        { id: "1", eventDate: new Date("2026-11-21T14:00:00"), title: "Example Data 1", description: "Example Description" },
        { id: "2", eventDate: new Date("2026-11-30T20:00:00"), title: "Example Data 2", description: "Example Description" },
        { id: "3", eventDate: new Date("2026-11-21T08:00:00"), title: "Example Data 3", description: "Example Description" },
    ]); 
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent>({ id: "-1", eventDate: new Date(), title: "", description: "" });
    const [openInfo, setOpenInfo] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [openAdd, setOpenAdd] = useState(false);

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
        return calendarData
        .filter( (data) => data.eventDate.toDateString() === date.toDateString() )
        .toSorted( (a, b) => a.eventDate.toTimeString().localeCompare(b.eventDate.toTimeString()) );
    }

    const getInputType = (field: string) => {
        if (field === "date") return "date";
        else if (field === "time") return "time";
        else return "text";
    }

    const getValue = (field: string) => {
        if (field === "title") return selectedEvent.title;
        else if (field === "date") return selectedEvent.eventDate.toISOString().split('T')[0];
        else if (field === "time") return selectedEvent.eventDate.toTimeString().slice(0, 5);
        else if (field === "description") return selectedEvent.description;
        else return "";
    }

    const editEvent = (formData: FormData) => {
        // editEvent(formData); // TODO: create edit function
        setOpenEdit(false);
    }

    const addEvent = (formData: FormData) => {
        const title = String(formData.get("title") ?? "");
        const description = String(formData.get("description") ?? "");
        const date = String(formData.get("date") ?? "");
        const time = String(formData.get("time") ?? "");

        const newEvent: CalendarEvent = {
            id: crypto.randomUUID(),
            title,
            description,
            eventDate: new Date(`${date}T${time}`)
        };

        setCalendarData(prev => [...prev, newEvent]);
        setOpenAdd(false);
    }

    const deleteEvent = () => {
        setCalendarData((prev) =>
            prev.filter((event) => event.id !== selectedEvent.id)
        );
        
        setOpenDelete(false); 
        setOpenEdit(false); 
        setOpenInfo(false);
    }

    return (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">

            <div className="mb-8">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    Content Creation Calendar
                </h2>
            </div>

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
                                            className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
                                        >
                                            Save
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
                                        className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
                                    >
                                        Yes
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