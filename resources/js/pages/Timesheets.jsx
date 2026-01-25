import React, { useEffect, useState } from 'react';
import axios from '../lib/axios';

export default function Timesheets() {
    const [week, setWeek] = useState(null);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const today = new Date().toISOString().slice(0, 10);

    useEffect(() => {
        loadWeek();
    }, [offset]);

    async function loadWeek() {
        setLoading(true);

        try {
            const res = await axios.get('/api/timesheets/week', {
                params: { offset } // send offset instead of week
            });

            setWeek(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }


    async function submitWeek() {
        if (!confirm('Submit this week? You will not be able to edit it.')) return;

        try {
            setSubmitting(true);
            await axios.post('/api/timesheets/submit-week', { week_start: week.week_start });
            loadWeek();
        } catch (err) {
            console.error(err);
            alert('Failed to submit week.');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return <div className="p-6 text-gray-500">Loading weekly timesheet…</div>;
    }

    console.log(week);

    return (
        <div className="max-w-5xl mx-auto space-y-6">

            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow border flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold">Weekly timesheet</h1>
                    <p className="text-sm text-gray-600 mt-1">{week.week_start} → {week.week_end}</p>

                    

                    {!week.submitted && (
                        <button
                            onClick={submitWeek}
                            disabled={submitting}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 mt-2"
                        >
                            {submitting ? 'Submitting…' : 'Submit week'}
                        </button>
                    )}

                    {week.submitted && (
                        <span className="px-3 py-2 rounded-lg bg-gray-200 text-gray-700 mt-2 inline-block">
                            Submitted
                        </span>
                    )}
                </div>

                {/* Week navigation */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setOffset(o => o - 1)}
                        className="px-3 py-2 border rounded-lg hover:bg-gray-100"
                    >
                        ← Prev
                    </button>
                    <button
                        onClick={() => setOffset(0)}
                        className="px-3 py-2 border rounded-lg hover:bg-gray-100"
                    >
                        This week
                    </button>
                    <button
                        onClick={() => setOffset(o => o + 1)}
                        className="px-3 py-2 border rounded-lg hover:bg-gray-100"
                    >
                        Next →
                    </button>
                </div>
            </div>

            {/* Days */}
            <div className="space-y-4">
                {week.days.map(day => {
                    const isToday = day.date === today;

                    return (
                        <div
                            key={day.date}
                            className={`rounded-2xl shadow border overflow-hidden relative
                                ${isToday ? 'bg-blue-50 border-blue-400' : 'bg-white'}
                            `}
                        >
                            {/* Day header */}
                            <div
                                className={`px-6 py-4 border-b flex justify-between items-center
                                    ${isToday ? 'border-blue-300' : ''}
                                `}
                            >
                                <div className="font-medium flex items-center gap-2">
                                    {day.label}
                                    {isToday && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white">
                                            Today
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm font-semibold">
                                    {formatMinutes(day.total_minutes)}
                                </div>
                            </div>

                            {/* Entries */}
                            {day.entries.length === 0 ? (
                                <div className="px-6 py-4 text-sm text-gray-400">No entries</div>
                            ) : (
                                <div className="divide-y relative">
                                    {day.entries.map(entry => (
                                        <div
                                            key={entry.id}
                                            className="px-6 py-4 flex justify-between text-sm"
                                        >
                                            <div>
                                                <div className="font-medium">{entry.project?.name ?? 'No project'}</div>
                                                {entry.description && (
                                                    <div className="text-gray-500">{entry.description}</div>
                                                )}
                                            </div>

                                            <div className="text-right">
                                                <div>
                                                    {formatTime(entry.started_at)} –{' '}
                                                    {entry.ended_at ? formatTime(entry.ended_at) : 'Running'}
                                                </div>
                                                <div className="font-semibold">
                                                    {formatMinutes(entry.duration_minutes)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* 🔒 Lock overlay */}
                                    {week.submitted && (
                                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-gray-700 font-semibold rounded-2xl pointer-events-none">
                                            Week submitted — locked
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* -------------------- Helpers -------------------- */
function formatMinutes(minutes = 0) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
}

function formatTime(datetime) {
    if (!datetime) return '';
    return new Date(datetime.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
