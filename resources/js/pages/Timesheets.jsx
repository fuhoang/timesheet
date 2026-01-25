import React, { useEffect, useState } from 'react';
import axios from '../lib/axios';

export default function Timesheets() {
    const [week, setWeek] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        try {
            const res = await axios.get('/api/timesheets/week');
            setWeek(res.data);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="text-gray-500">Loading week…</div>;
    }
    
    return (
        <div className="max-w-5xl mx-auto space-y-6">

            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow border">
                <h1 className="text-2xl font-semibold">
                    Weekly Timesheet
                </h1>

                <p className="text-gray-600 mt-1">
                    {week.start} → {week.end}
                </p>

                <p className="mt-2 font-medium">
                    Total: {formatMinutes(week.total_minutes)}
                </p>
            </div>

            {/* Days */}
            {week.days.map(day => (
                <div
                    key={day.date}
                    className="bg-white rounded-2xl shadow border overflow-hidden"
                >
                    <div className="px-6 py-4 border-b flex justify-between font-medium">
                        <span>{formatDate(day.date)}</span>
                        <span>{formatMinutes(day.total_minutes)}</span>
                    </div>

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

                                <div className="text-right text-gray-600">
                                    {formatTime(entry.started_at)} –{' '}
                                    {entry.ended_at
                                        ? formatTime(entry.ended_at)
                                        : 'Running'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* helpers */

function formatMinutes(min = 0) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m}m`;
}

function formatTime(dt) {
    return new Date(dt.replace(' ', 'T')).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatDate(date) {
    return new Date(date).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
    });
}
