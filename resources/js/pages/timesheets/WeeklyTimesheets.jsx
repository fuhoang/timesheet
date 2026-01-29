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
                url: 'api/timesheets/week',
                params: { offset },
            });
            setWeek(res);
        } finally {
            setLoading(false);
        }
    }

    async function submitWeek() {
        if (!confirm('Submit this week?')) return;

        setSubmitting(true);
        await api({
            method: 'post',
            url: '/api/timesheets/submit-week',
            data: { week_start: week.week_start },
        });

        loadWeek();
        setSubmitting(false);
    }

    if (loading) return <PageSkeleton />;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <WeekHeader
                week={week}
                offset={offset}
                setOffset={setOffset}
                submitWeek={submitWeek}
                submitting={submitting}
            />

            <div className="space-y-4">
                {week.days.map(day => (
                    <DayCard
                        key={day.date}
                        day={day}
                        isToday={day.date === today}
                        submitted={week.submitted}
                    />
                ))}
            </div>
        </div>
    );
}
