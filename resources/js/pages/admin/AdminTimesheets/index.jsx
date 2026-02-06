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
    const [filters, setFilters] = useState({
        status: '',
        q: '',
        date_from: '',
        date_to: '',
    });
    const hasActiveFilters = !!(
        filters.status ||
        filters.q ||
        filters.date_from ||
        filters.date_to
    );

    useEffect(() => {
        loadTimesheets();
    }, []);

    async function loadTimesheets() {
        setLoading(true);
        try {
            const res = await api({
                method: 'get',
                url: '/api/admin/timesheets',
                params: filters,
            });
            setTimesheets(res.data);
            setSelectedIds([]);
        } finally {
            setLoading(false);
        }
    }

    const reviewableIds = timesheets
        .filter(ts => ts.submitted_at && ts.status !== 'approved')
        .map(ts => ts.id);

    const allSubmittedSelected =
        reviewableIds.length > 0 &&
        reviewableIds.every(id => selectedIds.includes(id));

    function toggleSelectAllSubmitted() {
        if (allSubmittedSelected) {
            setSelectedIds(prev =>
                prev.filter(id => !reviewableIds.includes(id))
            );
            return;
        }

        setSelectedIds(prev => {
            const next = new Set(prev);
            reviewableIds.forEach(id => next.add(id));
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

    function updateFilter(key, value) {
        setFilters(prev => ({ ...prev, [key]: value }));
    }

    function applyFilters(e) {
        e?.preventDefault();
        loadTimesheets();
    }

    function clearFilters() {
        setFilters({ status: '', q: '', date_from: '', date_to: '' });
        loadTimesheets();
    }

    function setStatusTab(status) {
        setFilters(prev => ({ ...prev, status }));
        setTimeout(loadTimesheets, 0);
    }

    const statusTabs = [
        { label: 'All', value: '' },
        { label: 'Submitted', value: 'submitted' },
        { label: 'Draft', value: 'draft' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Approved', value: 'approved' },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow border">
                <h1 className="text-2xl font-semibold">Admin · Timesheets</h1>
                <p className="text-gray-600 mt-1">
                    Review and approve submitted timesheets
                </p>
            </div>

            <div className="bg-white p-3 rounded-2xl shadow border flex flex-wrap gap-2">
                {statusTabs.map(tab => {
                    const isActive = filters.status === tab.value;
                    return (
                        <button
                            key={tab.value}
                            type="button"
                            onClick={() => setStatusTab(tab.value)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                                isActive
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <form
                onSubmit={applyFilters}
                className="bg-white p-4 rounded-2xl shadow border flex flex-wrap gap-4 items-end"
            >
                <div className="flex flex-col">
                    <label className="text-xs text-gray-500">Status</label>
                    <select
                        value={filters.status}
                        onChange={e => updateFilter('status', e.target.value)}
                        className="border rounded-lg px-3 py-2"
                    >
                        <option value="">All</option>
                        <option value="submitted">Submitted</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="draft">Draft</option>
                        <option value="resubmitted">Resubmitted</option>
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="text-xs text-gray-500">User</label>
                    <input
                        type="text"
                        value={filters.q}
                        onChange={e => updateFilter('q', e.target.value)}
                        placeholder="Name or email"
                        className="border rounded-lg px-3 py-2"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-xs text-gray-500">From</label>
                    <input
                        type="date"
                        value={filters.date_from}
                        onChange={e => updateFilter('date_from', e.target.value)}
                        className="border rounded-lg px-3 py-2"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-xs text-gray-500">To</label>
                    <input
                        type="date"
                        value={filters.date_to}
                        onChange={e => updateFilter('date_to', e.target.value)}
                        className="border rounded-lg px-3 py-2"
                    />
                </div>

                <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                    Apply
                </button>
                <button
                    type="button"
                    onClick={clearFilters}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                    Clear
                </button>
            </form>

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
                    <div className="p-8 text-center">
                        <div className="text-sm font-semibold text-gray-900">
                            No timesheets found
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                            {hasActiveFilters
                                ? 'Try adjusting or clearing your filters.'
                                : 'Once users submit their weeks, they will show up here for review.'}
                        </div>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-4 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
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
                                            disabled={!ts.submitted_at || ts.status === 'approved'}
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
                                        <StatusBadge status={ts.status === 'draft' && ts.submitted_at ? 'resubmitted' : ts.status} />
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
        resubmitted: 'bg-blue-100 text-blue-800',
        draft: 'bg-gray-100 text-gray-700',
        submitted: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
    };

    const label = status === 'resubmitted' ? 'resubmitted' : status;

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[label] || styles[status]}`}>
            {label}
        </span>
    );
}
