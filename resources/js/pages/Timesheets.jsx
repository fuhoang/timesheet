import React, { useEffect, useState } from 'react';
import axios from '../lib/axios';

export default function Timesheets() {
    const [week, setWeek] = useState(null);
    const [currentWeek, setCurrentWeek] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadWeek();
    }, []);

    useEffect(() => {
        if (currentWeek) {
            loadWeek(currentWeek);
        }
    }, [currentWeek]);

    async function loadWeek(date = null) {
        try {
            setLoading(true);

            const res = await axios.get('/api/timesheets/week', {
                params: date ? { week: date } : {},
            });

            setWeek(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function prevWeek() {
        const d = new Date(week.week_start);
        d.setDate(d.getDate() - 7);
        setCurrentWeek(d.toISOString().slice(0, 10));
    }

    function nextWeek() {
        const d = new Date(week.week_start);
        d.setDate(d.getDate() + 7);
        setCurrentWeek(d.toISOString().slice(0, 10));
    }

    if (loading || !week) {
        return (
            <div className="p-6 text-gray-500">
                Loading weekly timesheet…
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">

            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow border">
                <div className="flex items-center justify-between">

                    <button
                        onClick={prevWeek}
                        className="px-3 py-1 rounded-lg border hover:bg-gray-100"
                    >
                        ← Previous
                    </button>

                    <div className="text-center">
                        <h1 className="text-xl font-semibold">
                            Weekly Timesheet
                        </h1>
                        <p className="text-gray-600 text-sm">
                            {week.week_start} → {week.week_end}
                        </p>
                        <p className="font-medium mt-1">
                            Total: {formatMinutes(week.weekly_total_minutes)}
                        </p>
                    </div>

                    <button
                        onClick={nextWeek}
                        className="px-3 py-1 rounded-lg border hover:bg-gray-100"
                    >
                        Next →
                    </button>

                </div>
            </div>

            {/* Days */}
            {week.days.map(day => (
                <div
                    key={day.date}
                    className="bg-white rounded-2xl shadow border overflow-hidden"
                >
                    <div className="px-6 py-4 border-b flex justify-between">
                        <div className="font-medium">
                            {day.label}
                        </div>

                        <div className="text-sm font-semibold">
                            {formatMinutes(day.total_minutes)}
                        </div>
                    </div>

                    {day.entries.length === 0 ? (
                        <div className="px-6 py-4 text-sm text-gray-500">
                            No entries
                        </div>
                    ) : (
                        <div className="divide-y">
                            {day.entries.map(entry => (
                                <div
                                    key={entry.id}
                                    className="px-6 py-4 flex justify-between text-sm"
                                >
                                    <div>
                                        <div className="font-medium">
                                            {entry.project?.name ?? 'No project'}
                                        </div>

                                        {entry.description && (
                                            <div className="text-gray-500">
                                                {entry.description}
                                            </div>
                                        )}
                                    </div>

                                    <div className="font-medium">
                                        {formatMinutes(entry.duration_minutes)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function formatMinutes(minutes = 0) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
}
