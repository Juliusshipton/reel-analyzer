"use client";

import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export function ContentCalendar() {
    const [selectedDate, setSelectedDate] = useState(new Date());

    const today = new Date();

    const getTileClassName = ({ date, view }) => {
        if ( !(selectedDate instanceof Date) ) return null;

        // TODO: Display indicator/event info on dates that have coorsponding event data

        // Formatting for selected date/month/year in Month/Year/Decade View
        if (
            ( view === 'month' && date.toDateString() === selectedDate.toDateString() ) || 
            ( view === 'year' && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear() ) ||
            ( view === 'decade' && date.getFullYear() === selectedDate.getFullYear() )
        ) {
            return '!bg-red-400 !text-white !font-bold rounded-lg'; 
        }
        // Formatting for today's date/month/year that is not selected in Month/Year/Decade View
        else if ( 
            ( view === 'month' && date.toDateString() === today.toDateString() ) ||
            ( view === 'year' && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear() ) ||
            ( view === 'decade' && date.getFullYear() === today.getFullYear() )
        ) {
            return '!bg-gray-200 rounded-lg hover:!bg-red-100'; 
        }
        // Formatting for hovered elements
        else {
            return 'hover:!bg-red-100 rounded-lg';
        }
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
                    className="!w-[79%] !max-w-none h-96 !rounded-2xl border !border-zinc-200 !bg-white !p-6 !shadow-sm !dark:border-zinc-800 !dark:bg-zinc-900"
                    tileClassName={getTileClassName}
                    minDetail="decade"
                    calendarType="gregory"
                    defaultView="month"
                    onChange={setSelectedDate} 
                    value={selectedDate}
                />

                <div className="w-[20%] rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <h3 className="text-l text-zinc-900 dark:text-zinc-50 text-center">
                        {selectedDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </h3>
                    <hr className="my-6 border-t border-zinc-200 dark:border-sinz-800" />
                    {/* TODO: Display event data from selected date */}
                </div>
            </div>
        </section>
    );
}