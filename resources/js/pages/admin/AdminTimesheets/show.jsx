import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../../context/ApiContext';
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
                    {timesheet.user.name} · {timesheet.work_date}
                </p>
            </div>

            {/* Status */}
            <div className="bg-white p-4 rounded-2xl shadow border flex items-center justify-between">
                <span className="font-medium">
                    Status:
                    <StatusBadge status={timesheet.status} />
                </span>

                {timesheet.status === 'draft' && (
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
