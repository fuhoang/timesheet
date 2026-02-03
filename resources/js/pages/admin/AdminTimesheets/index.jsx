import React, { useEffect, useState } from 'react';
import { useApi } from '../../../context/ApiContext';
import { Link } from 'react-router-dom';
import { formatDate } from '../../../utils/date';



export default function AdminTimesheets() {
    const { api } = useApi();
    const [timesheets, setTimesheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        loadTimesheets();
    }, []);

    async function loadTimesheets() {
        setLoading(true);
        try {
            const res = await api({
                method: 'get',
                url: '/api/admin/timesheets',
            });
            setTimesheets(res.data);
            setSelectedIds([]);
        } finally {
            setLoading(false);
        }
    }

    const submittedIds = timesheets
        .filter(ts => ts.status === 'submitted')
        .map(ts => ts.id);

    const allSubmittedSelected =
        submittedIds.length > 0 &&
        submittedIds.every(id => selectedIds.includes(id));

    function toggleSelectAllSubmitted() {
        if (allSubmittedSelected) {
            setSelectedIds(prev =>
                prev.filter(id => !submittedIds.includes(id))
            );
            return;
        }

        setSelectedIds(prev => {
            const next = new Set(prev);
            submittedIds.forEach(id => next.add(id));
            return Array.from(next);
        });
    }

    function toggleSelectOne(id) {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }

    function showToast(message, type = 'success') {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }

    async function bulkApprove() {
        if (selectedIds.length === 0 || bulkLoading) return;
        if (!confirm(`Approve ${selectedIds.length} timesheet(s)?`)) return;

        setBulkLoading(true);
        try {
            const res = await api({
                method: 'post',
                url: '/api/admin/timesheets/bulk-approve',
                data: { ids: selectedIds },
            });
            showToast(res.message || 'Timesheets approved');
            await loadTimesheets();
        } catch (err) {
            showToast(
                err.response?.data?.message || 'Bulk approve failed',
                'error'
            );
        } finally {
            setBulkLoading(false);
        }
    }

    async function bulkReject() {
        if (selectedIds.length === 0 || bulkLoading) return;
        const reason = window.prompt('Rejection reason (required):');
        if (!reason || !reason.trim()) return;

        if (!confirm(`Reject ${selectedIds.length} timesheet(s)?`)) return;

        setBulkLoading(true);
        try {
            const res = await api({
                method: 'post',
                url: '/api/admin/timesheets/bulk-reject',
                data: { ids: selectedIds, reason: reason.trim() },
            });
            showToast(res.message || 'Timesheets rejected');
            await loadTimesheets();
        } catch (err) {
            showToast(
                err.response?.data?.message || 'Bulk reject failed',
                'error'
            );
        } finally {
            setBulkLoading(false);
        }
    }
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow border">
                <h1 className="text-2xl font-semibold">Admin · Timesheets</h1>
                <p className="text-gray-600 mt-1">
                    Review and approve submitted timesheets
                </p>
            </div>

            {toast && (
                <div
                    className={`fixed top-4 right-4 px-4 py-2 rounded-lg text-white shadow-lg z-50
                    ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}
                >
                    {toast.message}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow border overflow-hidden">
                {loading ? (
                    <div className="p-6 text-gray-500">Loading timesheets…</div>
                ) : timesheets.length === 0 ? (
                    <div className="p-6 text-gray-500">No submitted timesheets</div>
                ) : (
                    <>
                        <div className="px-4 py-3 border-b flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                {selectedIds.length} selected
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={bulkApprove}
                                    disabled={selectedIds.length === 0 || bulkLoading}
                                    className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-60"
                                >
                                    {bulkLoading ? 'Working…' : 'Bulk approve'}
                                </button>
                                <button
                                    onClick={bulkReject}
                                    disabled={selectedIds.length === 0 || bulkLoading}
                                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-60"
                                >
                                    Bulk reject
                                </button>
                            </div>
                        </div>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left w-10">
                                    <input
                                        type="checkbox"
                                        checked={allSubmittedSelected}
                                        onChange={toggleSelectAllSubmitted}
                                    />
                                </th>
                                <th className="px-4 py-3 text-left">User</th>
                                <th className="px-4 py-3 text-left">Week</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {timesheets.map(ts => (
                                <tr key={ts.id}>
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            disabled={ts.status !== 'submitted'}
                                            checked={selectedIds.includes(ts.id)}
                                            onChange={() => toggleSelectOne(ts.id)}
                                        />
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                        {ts.user.name}
                                    </td>
                                    <td className="px-4 py-3">
                                        {formatDate(ts.work_date)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={ts.status} />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            to={`/admin/timesheets/${ts.id}`}
                                            className="text-indigo-600 hover:underline"
                                        >
                                            Review
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const styles = {
        submitted: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
            {status}
        </span>
    );
}
