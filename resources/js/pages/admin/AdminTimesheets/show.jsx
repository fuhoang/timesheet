import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../../context/ApiContext';
import { formatDate } from '../../../utils/date';
import RejectModal from './RejectModal';


export default function AdminTimesheetShow() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { api } = useApi();

    const [timesheet, setTimesheet] = useState(null);
    const [loading, setLoading] = useState(true);

    const [approving, setApproving] = useState(false);
    const [showReject, setShowReject] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [rejectError, setRejectError] = useState(null);
    const [dayNote, setDayNote] = useState('');
    const [savingDayNote, setSavingDayNote] = useState(false);
    const [savingEntryId, setSavingEntryId] = useState(null);
    const [entryNotes, setEntryNotes] = useState({});

    /* ---------------- Load timesheet ---------------- */

    useEffect(() => {
        fetchTimesheet();
    }, []);

    async function fetchTimesheet() {
        setLoading(true);
        try {
            const res = await api({
                method: 'get',
                url: `/api/admin/timesheets/${id}`,
            });
            setTimesheet(res);
            setDayNote(res.admin_note || '');
            const notes = {};
            (res.entries || []).forEach(entry => {
                notes[entry.id] = entry.admin_note || '';
            });
            setEntryNotes(notes);
        } catch (err) {
            navigate('/admin/timesheets');
        } finally {
            setLoading(false);
        }
    }

    /* ---------------- Approve ---------------- */

    async function approveTimesheet() {
        if (approving) return;

        setApproving(true);
        try {
            await api({
                method: 'post',
                url: `/api/admin/timesheets/${id}/approve`,
            });

            setTimesheet(prev => ({
                ...prev,
                status: 'approved',
                approved_at: new Date().toISOString(),
            }));
        } finally {
            setApproving(false);
        }
    }

    /* ---------------- Reject ---------------- */

    async function rejectTimesheet(reason) {
        if (!reason.trim()) {
            setRejectError('Rejection reason is required');
            return;
        }

        setRejecting(true);
        setRejectError(null);

        try {
            await api({
                method: 'post',
                url: `/api/admin/timesheets/${id}/reject`,
                data: { reason },
            });

            setTimesheet(prev => ({
                ...prev,
                status: 'rejected',
                rejection_reason: reason,
            }));

            setShowReject(false);
        } catch (err) {
            setRejectError(
                err.response?.data?.message || 'Failed to reject timesheet'
            );
        } finally {
            setRejecting(false);
        }
    }

    /* ---------------- Day note ---------------- */

    async function saveDayNote() {
        if (!timesheet || savingDayNote) return;

        setSavingDayNote(true);
        try {
            const res = await api({
                method: 'patch',
                url: `/api/admin/timesheets/${id}/note`,
                data: { admin_note: dayNote },
            });

            setTimesheet(prev => ({
                ...prev,
                admin_note: res.timesheet?.admin_note ?? dayNote,
            }));
        } finally {
            setSavingDayNote(false);
        }
    }

    /* ---------------- Entry note ---------------- */

    async function saveEntryNote(entryId) {
        if (!entryId || savingEntryId) return;

        setSavingEntryId(entryId);
        try {
            const res = await api({
                method: 'patch',
                url: `/api/admin/time-entries/${entryId}/note`,
                data: { admin_note: entryNotes[entryId] || '' },
            });

            setTimesheet(prev => ({
                ...prev,
                entries: prev.entries.map(entry =>
                    entry.id === entryId
                        ? { ...entry, admin_note: res.entry?.admin_note ?? entryNotes[entryId] }
                        : entry
                ),
            }));
        } finally {
            setSavingEntryId(null);
        }
    }

    /* ---------------- Render states ---------------- */

    if (loading) {
        return (
            <div className="p-6 text-gray-500">
                Loading timesheet…
            </div>
        );
    }

    if (!timesheet) {
        return (
            <div className="p-6 text-gray-500">
                Timesheet not found
            </div>
        );
    }

    console.log(timesheet.entries);
    
    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow border">
                <h1 className="text-2xl font-semibold">
                    Review Timesheet
                </h1>
                <p className="text-gray-600 mt-1">
                    {timesheet.user.name} · {formatDate(timesheet.work_date)} 
                </p>
            </div>

            {/* Status */}
            <div className="bg-white p-4 rounded-2xl shadow border flex items-center justify-between">
                <span className="font-medium">
                    Status:
                    <StatusBadge status={timesheet.status} />
                </span>

                {timesheet.status === 'submitted' && (
                    <div className="flex space-x-2">
                        <button
                            onClick={approveTimesheet}
                            disabled={approving}
                            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                        >
                            {approving ? 'Approving…' : 'Approve'}
                        </button>

                        <button
                            onClick={() => setShowReject(true)}
                            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                        >
                            Reject
                        </button>
                    </div>
                )}
            </div>

            {/* Admin note for day */}
            <div className="bg-white p-4 rounded-2xl shadow border space-y-3">
                <div className="font-medium">Admin note (day)</div>
                <textarea
                    className="w-full min-h-24 border rounded-lg px-3 py-2 focus:outline-none focus:ring"
                    value={dayNote}
                    onChange={e => setDayNote(e.target.value)}
                    placeholder="Optional note for this day..."
                />
                <div className="flex justify-end">
                    <button
                        onClick={saveDayNote}
                        disabled={savingDayNote}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                        {savingDayNote ? 'Saving…' : 'Save note'}
                    </button>
                </div>
            </div>

            {/* Entries */}
            <div className="bg-white rounded-2xl shadow border overflow-hidden">
                <div className="p-4 font-semibold border-b">
                    Time Entries
                </div>

                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left">Project</th>
                            <th className="px-4 py-3 text-left">Description</th>
                            <th className="px-4 py-3 text-right">Minutes</th>
                            <th className="px-4 py-3 text-left">Admin Note</th>
                            <th className="px-4 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {timesheet.entries.map(entry => (
                            <tr key={entry.id}>
                                <td className="px-4 py-3">
                                    {entry.project?.name || '—'}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {entry.description || '—'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {entry.duration_minutes}
                                </td>
                                <td className="px-4 py-3">
                                    <textarea
                                        className="w-full min-h-16 border rounded px-2 py-1"
                                        value={entryNotes[entry.id] ?? ''}
                                        onChange={e =>
                                            setEntryNotes(prev => ({
                                                ...prev,
                                                [entry.id]: e.target.value,
                                            }))
                                        }
                                        placeholder="Optional note..."
                                    />
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => saveEntryNote(entry.id)}
                                        disabled={savingEntryId === entry.id}
                                        className="text-indigo-600 hover:underline disabled:opacity-60"
                                    >
                                        {savingEntryId === entry.id ? 'Saving…' : 'Save'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Reject Modal */}
            <RejectModal
                open={showReject}
                onClose={() => {
                    setShowReject(false);
                    setRejectError(null);
                }}
                onConfirm={rejectTimesheet}
                loading={rejecting}
                error={rejectError}
            />
        </div>
    );
}

/* ---------------- Status Badge ---------------- */

function StatusBadge({ status }) {
    const styles = {
        draft: 'bg-gray-100 text-gray-700',
        submitted: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
    };

    return (
        <span
            className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}
        >
            {status}
        </span>
    );
}
