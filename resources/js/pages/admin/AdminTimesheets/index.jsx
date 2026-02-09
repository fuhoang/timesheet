import React, { useEffect, useState } from 'react';
import { useApi } from '../../../context/ApiContext';
import { Link } from 'react-router-dom';
import { formatDate } from '../../../utils/date';
import Toast from '../../../components/ui/Toast';
import StatusBadge from '../../../components/ui/StatusBadge';
import Button from '../../../components/ui/Button';



export default function AdminTimesheets() {
    const { api } = useApi();
    const [timesheets, setTimesheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        from: 0,
        to: 0,
        total: 0,
    });
    const [perPage, setPerPage] = useState(20);
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

    async function loadTimesheets(page = 1) {
        setLoading(true);
        try {
            const res = await api({
                method: 'get',
                url: '/api/admin/timesheets',
                params: {
                    ...filters,
                    page,
                    per_page: perPage,
                },
            });
            setTimesheets(res.data);
            setPagination({
                current_page: res.current_page ?? 1,
                last_page: res.last_page ?? 1,
                from: res.from ?? 0,
                to: res.to ?? 0,
                total: res.total ?? res.data?.length ?? 0,
            });
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
        loadTimesheets(1);
    }

    function clearFilters() {
        setFilters({ status: '', q: '', date_from: '', date_to: '' });
        loadTimesheets(1);
    }

    function setStatusTab(status) {
        setFilters(prev => ({ ...prev, status }));
        setTimeout(() => loadTimesheets(1), 0);
    }

    function goToPage(page) {
        if (page < 1 || page > pagination.last_page) return;
        loadTimesheets(page);
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
                        <Button
                            key={tab.value}
                            type="button"
                            onClick={() => setStatusTab(tab.value)}
                            variant={isActive ? 'primary' : 'secondary'}
                            size="sm"
                            className={`rounded-full ${isActive ? 'border border-blue-600' : 'border-gray-200'}`}
                        >
                            {tab.label}
                        </Button>
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

                <div className="flex flex-col">
                    <label className="text-xs text-gray-500">Per page</label>
                    <select
                        value={perPage}
                        onChange={e => {
                            setPerPage(Number(e.target.value));
                            loadTimesheets(1);
                        }}
                        className="border rounded-lg px-3 py-2"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>

                <Button
                    type="submit"
                    variant="primary"
                >
                    Apply
                </Button>
                <Button
                    type="button"
                    onClick={clearFilters}
                    variant="secondary"
                >
                    Clear
                </Button>
            </form>

            {toast && <Toast message={toast.message} type={toast.type} />}

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
                            <Button
                                type="button"
                                onClick={clearFilters}
                                variant="secondary"
                                size="sm"
                                className="mt-4"
                            >
                                Clear filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="px-4 py-3 border-b flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                {selectedIds.length} selected
                                <span className="ml-3 text-xs text-gray-400">
                                    Showing {pagination.from}-{pagination.to} of {pagination.total}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={bulkApprove}
                                    disabled={selectedIds.length === 0 || bulkLoading}
                                    variant="success"
                                    size="sm"
                                >
                                    {bulkLoading ? 'Working…' : 'Bulk approve'}
                                </Button>
                                <Button
                                    onClick={bulkReject}
                                    disabled={selectedIds.length === 0 || bulkLoading}
                                    variant="danger"
                                    size="sm"
                                >
                                    Bulk reject
                                </Button>
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
                        <div className="px-4 py-3 border-t flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Page {pagination.current_page} of {pagination.last_page}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => goToPage(pagination.current_page - 1)}
                                    disabled={pagination.current_page <= 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => goToPage(pagination.current_page + 1)}
                                    disabled={pagination.current_page >= pagination.last_page}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
