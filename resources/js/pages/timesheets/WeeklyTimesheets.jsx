import React, { useEffect, useMemo, useState } from 'react';
import { useApi } from '../../context/ApiContext';
import { PageSkeleton } from '../../components/skeletons/PageSkeleton';

import WeekHeader from './components/WeekHeader';
import DayCard from './components/DayCard';

export default function WeeklyTimesheet() {
    const { api } = useApi();
    const isDev = !!import.meta?.env?.DEV || window?.__APP_ENV__ === 'local';

    const [week, setWeek] = useState(null);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const [error, setError] = useState('');

    const today = new Date().toISOString().slice(0, 10);

    useEffect(() => {
        loadWeek();
    }, [offset]);

    const firstRejectedDate = useMemo(() => {
        if (!week?.days?.length) return null;
        const rejected = week.days.find(day => day.status === 'rejected');
        return rejected?.date || null;
    }, [week]);

    useEffect(() => {
        if (!firstRejectedDate) return;
        const el = document.getElementById(`day-${firstRejectedDate}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [firstRejectedDate]);

    async function loadWeek() {
        setLoading(true);
        setError('');
        try {
            const res = await api({
                method: 'get',
                url: '/api/timesheets/week',
                params: { offset },
            });

            setWeek(res);
        } catch (err) {
            console.error('Failed to load week', err);
            setError('Unable to load this week. Please try again.');
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

            setToast({ message: 'Timesheet submitted for approval', type: 'success' });
            setTimeout(() => setToast(null), 3000);
            await loadWeek();
        } catch (err) {
            console.error('Failed to submit week', err);
            setError('Unable to submit the week. Please try again.');
            setToast({ message: 'Failed to submit timesheet', type: 'error' });
            setTimeout(() => setToast(null), 3000);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <PageSkeleton />;

    const locked = !!week.locked;


    const isApproved = week.status === 'approved';
    const isRejected = week.status === 'rejected';

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {toast && (
                <div
                    className={`fixed top-4 right-4 z-50 px-4 py-2 text-white rounded-md shadow ${
                        toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
                    }`}
                >
                    {toast.message}
                </div>
            )}

            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {isDev && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => setError(prev => prev ? '' : 'Unable to load this week. Please try again.')}
                        className="text-xs font-medium text-gray-500 hover:text-gray-700"
                    >
                        Toggle error (dev)
                    </button>
                </div>
            )}

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
