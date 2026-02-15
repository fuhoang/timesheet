import React from 'react';
import Button from '../../../components/ui/Button';

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
                    <Button
                        onClick={submitWeek}
                        disabled={submitting}
                        className="mt-2"
                        variant="primary"
                    >
                        {submitting ? 'Submitting…' : 'Submit week'}
                    </Button>
                ) : (
                    <div className="mt-2 space-y-1">
                        <span className="px-3 py-2 rounded-lg bg-gray-200 text-gray-900 dark:bg-slate-700 dark:text-slate-100 inline-block">
                            {week.week_complete ? 'Submitted' : 'Week in progress'}
                        </span>
                        {!week.week_complete && week.submit_available_at && (
                            <div className="text-xs text-gray-500">
                                You can submit after {new Date(week.submit_available_at).toLocaleString()}.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                <Button
                    onClick={() => setOffset(o => o - 1)} 
                    variant="secondary"
                >
                        ← Prev
                </Button>
                <Button
                    onClick={() => setOffset(0)} 
                    variant="secondary"
                >
                        This week
                </Button>
                <Button
                    onClick={() => setOffset(o => o + 1)} 
                    variant="secondary"
                >
                        Next →
                </Button>
            </div>
        </div>
    );
}
