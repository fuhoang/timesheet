import React, { useEffect, useState } from 'react';
import { useApi } from '../../context/ApiContext';
import { PageSkeleton } from '../../components/skeletons/PageSkeleton';

import WeekHeader from './components/WeekHeader';
import DayCard from './components/DayCard';

export default function WeeklyTimesheet() {
    const { api } = useApi();

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
            const res = await api({
                method: 'get',
                url: '/api/timesheets/week',
                params: { offset },
            });

            setWeek(res);
        } finally {
            setLoading(false);
        }
    }

    async function submitWeek() {
        if (!confirm('Submit this week for approval?')) return;

        try {
            setSubmitting(true);

            await api({
                method: 'post',
                url: '/api/timesheets/submit-week',
                data: {
                    week_start: week.week_start,
                },
            });

            await loadWeek();
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <PageSkeleton />;

    const locked =
    week.status === 'approved' ||
    week.status === 'submitted';


    const isApproved = week.status === 'approved';
    const isRejected = week.status === 'rejected';

    return (
        <div className="max-w-5xl mx-auto space-y-6">

            {/* 🔴 Rejection banner */}
            {isRejected && week.rejection_reason && (
                <div className="rounded-2xl border border-red-300 bg-red-50 p-4">
                    <div className="font-semibold text-red-800">
                        Timesheet rejected
                    </div>
                    <div className="text-sm text-red-700 mt-1">
                        {week.rejection_reason}
                    </div>
                    <div className="text-xs text-red-600 mt-2">
                        Please correct the issues and resubmit the week.
                    </div>
                </div>
            )}

            {/* 🟢 Approved banner */}
            {isApproved && (
                <div className="rounded-2xl border border-green-300 bg-green-50 p-4">
                    <div className="font-semibold text-green-800">
                        Timesheet approved
                    </div>
                    <div className="text-sm text-green-700 mt-1">
                        This week is locked and can no longer be edited.
                    </div>
                </div>
            )}

            {/* Week header */}
            <WeekHeader
                week={week}
                offset={offset}
                setOffset={setOffset}
                submitWeek={submitWeek}
                submitting={submitting}
                disabled={isApproved}
            />

            {/* Days */}
            <div className="space-y-4">
                {week.days.map(day => (
                    <DayCard
                        key={day.date}
                        day={day}
                        isToday={day.date === today}
                        locked={locked}
                        onUpdated={loadWeek}
                    />
                ))}
            </div>
        </div>
    );
}
