import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../../context/ApiContext';
import { formatDate } from '../../../utils/date';
import RejectModal from './RejectModal';
import StatusBadge from '../../../components/ui/StatusBadge';
import Button from '../../../components/ui/Button';
import { getApiErrorDetails } from '../../../utils/apiError';


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
    const [statusHistory, setStatusHistory] = useState([]);
    const [historyFilter, setHistoryFilter] = useState('all');

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
            const history = await api({
                method: 'get',
                url: `/api/admin/timesheets/${id}/history`,
            });
            setStatusHistory(history);
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
            setRejectError(getApiErrorDetails(err, 'Failed to reject timesheet').fullMessage);
        } finally {
            setRejecting(false);
        }
    }

    /* ---------------- Day note ---------------- */

    async function saveDayNote() {
        if (!timesheet || savingDayNote) return;

        setSavingDayNote(true);
        try {
            await api({
                method: 'patch',
                url: `/api/admin/timesheets/${id}/note`,
                data: { admin_note: dayNote },
            });

            setTimesheet(prev => ({
                ...prev,
                admin_note: dayNote,
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
            await api({
                method: 'patch',
                url: `/api/admin/time-entries/${entryId}/note`,
                data: { admin_note: entryNotes[entryId] || '' },
            });

            setTimesheet(prev => ({
                ...prev,
                entries: prev.entries.map(entry =>
                    entry.id === entryId
                        ? { ...entry, admin_note: entryNotes[entryId] }
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

    const filteredHistory = historyFilter === 'all'
        ? statusHistory
        : statusHistory.filter(item => item.to_status === historyFilter);

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
                    <StatusBadge
                        status={timesheet.status === 'draft' && timesheet.submitted_at ? 'resubmitted' : timesheet.status}
                        className="ml-2"
                    />
                </span>

                {timesheet.submitted_at && timesheet.status !== 'approved' && (
                    <div className="flex space-x-2">
                        <Button
                            onClick={approveTimesheet}
                            disabled={approving}
                            variant="success"
                        >
                            {approving ? 'Approving…' : 'Approve'}
                        </Button>

                        <Button
                            onClick={() => setShowReject(true)}
                            variant="danger"
                        >
                            Reject
                        </Button>
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
                    <Button
                        onClick={saveDayNote}
                        disabled={savingDayNote}
                        variant="primary"
                    >
                        {savingDayNote ? 'Saving…' : 'Save note'}
                    </Button>
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
                                    <Button
                                        onClick={() => saveEntryNote(entry.id)}
                                        disabled={savingEntryId === entry.id}
                                        variant="link"
                                        size="xs"
                                        className="disabled:opacity-60"
                                    >
                                        {savingEntryId === entry.id ? 'Saving…' : 'Save'}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-white rounded-2xl shadow border overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between gap-3">
                    <div className="font-semibold">Status History</div>
                    <select
                        value={historyFilter}
                        onChange={e => setHistoryFilter(e.target.value)}
                        className="border rounded-lg px-2 py-1 text-xs"
                    >
                        <option value="all">All transitions</option>
                        <option value="draft">To draft</option>
                        <option value="submitted">To submitted</option>
                        <option value="approved">To approved</option>
                        <option value="rejected">To rejected</option>
                    </select>
                </div>
                {filteredHistory.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500">No status transitions logged yet.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left">When</th>
                                <th className="px-4 py-3 text-left">From</th>
                                <th className="px-4 py-3 text-left">To</th>
                                <th className="px-4 py-3 text-left">By</th>
                                <th className="px-4 py-3 text-left">Source</th>
                                <th className="px-4 py-3 text-left">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredHistory.map(item => (
                                <tr key={item.id}>
                                    <td className="px-4 py-3 text-gray-600">
                                        {new Date(item.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">{item.from_status || '—'}</td>
                                    <td className="px-4 py-3 font-medium">{item.to_status}</td>
                                    <td className="px-4 py-3 text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <span>{item.actor?.name || item.actor_role || 'system'}</span>
                                            {item.actor_role && (
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                                        item.actor_role === 'admin'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}
                                                >
                                                    {item.actor_role}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700">
                                            {item.context?.source || 'manual'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{item.reason || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
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
