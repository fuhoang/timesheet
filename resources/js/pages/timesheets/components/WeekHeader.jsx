import React from 'react';

export default function WeekHeader({
    week,
    offset,
    setOffset,
    submitWeek,
    submitting
}) {

    console.log(week);
    return (
        <div className="bg-white p-6 rounded-2xl shadow border flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-semibold">Weekly timesheet</h1>
                <p className="text-sm text-gray-600 mt-1">
                    {week.week_start} → {week.week_end}
                </p>

                {week.can_submit ? (
                    <button
                        onClick={submitWeek}
                        disabled={submitting}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg mt-2"
                    >
                        {submitting ? 'Submitting…' : 'Submit week'}
                    </button>
                ) : (
                    <span className="px-3 py-2 rounded-lg bg-gray-200 text-black dark:bg-white/70 dark:text-black mt-2 inline-block">
                        Submitted
                    </span>
                )}
            </div>

            <div className="flex gap-2">
                <button 
                    onClick={() => setOffset(o => o - 1)} 
                    className="px-3 py-2 border rounded-lg hover:bg-gray-100">
                        ← Prev
                </button>
                <button 
                    onClick={() => setOffset(0)} 
                    className="px-3 py-2 border rounded-lg hover:bg-gray-100">
                        This week
                </button>
                <button 
                    onClick={() => setOffset(o => o + 1)} 
                    className="px-3 py-2 border rounded-lg hover:bg-gray-100">
                        Next →
                </button>
            </div>
        </div>
    );
}
