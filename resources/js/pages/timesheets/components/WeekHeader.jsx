import React from 'react';

export default function WeekHeader({
    week,
    offset,
    setOffset,
    submitWeek,
    submitting
}) {

    return (
        <div className="bg-white p-6 rounded-2xl shadow border flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Weekly timesheet</h1>
                <p className="text-sm text-gray-600 mt-1">
                    {week.week_start} → {week.week_end}
                </p>

                {week.can_submit ? (
                    <button
                        onClick={submitWeek}
                        disabled={submitting}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg mt-2 hover:bg-blue-700 disabled:opacity-60"
                    >
                        {submitting ? 'Submitting…' : 'Submit week'}
                    </button>
                ) : (
                    <span className="px-3 py-2 rounded-lg bg-gray-200 text-gray-900 dark:bg-white/70 dark:text-black mt-2 inline-block">
                        Submitted
                    </span>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                <button 
                    onClick={() => setOffset(o => o - 1)} 
                    className="px-3 py-2 border rounded-lg text-gray-700 hover:bg-gray-100">
                        ← Prev
                </button>
                <button 
                    onClick={() => setOffset(0)} 
                    className="px-3 py-2 border rounded-lg text-gray-700 hover:bg-gray-100">
                        This week
                </button>
                <button 
                    onClick={() => setOffset(o => o + 1)} 
                    className="px-3 py-2 border rounded-lg text-gray-700 hover:bg-gray-100">
                        Next →
                </button>
            </div>
        </div>
    );
}
