"use client";

import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import type { CalendarEvent } from '@/types/event';

export function ContentCalendar() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    // TODO: implement persistent data storage
    const [calendarData, setCalendarData] = useState<CalendarEvent[]>([
        { id: 1, eventDate: new Date("2026-11-21T14:00:00"), title: "Example Data 1", description: "Example Description" },
        { id: 2, eventDate: new Date("2026-11-30T20:00:00"), title: "Example Data 2", description: "Example Description" },
        { id: 3, eventDate: new Date("2026-11-21T08:00:00"), title: "Example Data 3", description: "Example Description" }
    ]); 
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent>({ id: -1, eventDate: new Date(), title: "", description: "" });

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

        const classes = ['hover:!bg-red-100', 'rounded-lg'];

        // Formatting for dates with events in calendar
        if (getEvents(date).length > 0) {
            classes.push('!bg-blue-400'); // TODO: Change this to symbol indicator
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

    return (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">

            <div className="mb-8">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    Content Creation Calendar
                </h2>
            </div>

            <div className="flex justify-between">
                <Calendar 
                    className="!w-[69%] !max-w-none h-96 !rounded-2xl border !border-zinc-200 !bg-white !p-6 !shadow-sm !dark:border-zinc-800 !dark:bg-zinc-900"
                    tileClassName={getTileClassName}
                    minDetail="decade"
                    calendarType="gregory"
                    defaultView="month"
                    onChange={handleDateChange} 
                    value={selectedDate}
                />

                <div className="w-[30%] rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <h3 className="text-l text-zinc-900 dark:text-zinc-50 text-center font-bold">
                        {selectedDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </h3>
                    <hr className="my-6 border-t border-zinc-200 dark:border-sinz-800" />
                    <div className="flex flex-col gap-2">
                        {getEvents(selectedDate).map((data) => (
                            <button
                                key={data.id}
                                type="button"
                                onClick={() => setSelectedEvent(data)}
                                className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
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
                            // onClick={() => } TODO: create Add Event function to save new CalendarEvents
                            className="rounded-xl bg-red-600 px-8 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                        >
                            Add Event
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}