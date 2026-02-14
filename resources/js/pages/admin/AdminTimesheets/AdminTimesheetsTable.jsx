import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../../utils/date';
import StatusBadge from '../../../components/ui/StatusBadge';
import Button from '../../../components/ui/Button';

export default function AdminTimesheetsTable({
    loading,
    timesheets,
    hasActiveFilters,
    onClearFilters,
    selectedIds,
    bulkLoading,
    onBulkApprove,
    onBulkReject,
    pagination,
    allSubmittedSelected,
    onToggleSelectAll,
    onToggleSelectOne,
    onGoToPage,
}) {
    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow border overflow-hidden">
                <div className="p-6 text-gray-500">Loading timesheets…</div>
            </div>
        );
    }

    if (timesheets.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow border overflow-hidden">
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
                            onClick={onClearFilters}
                            variant="secondary"
                            size="sm"
                            className="mt-4"
                        >
                            Clear filters
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow border overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
                <div className="text-sm text-gray-600">
                    {selectedIds.length} selected
                    <span className="ml-3 text-xs text-gray-400">
                        Showing {pagination.from}-{pagination.to} of {pagination.total}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={onBulkApprove}
                        disabled={selectedIds.length === 0 || bulkLoading}
                        variant="success"
                        size="sm"
                    >
                        {bulkLoading ? 'Working…' : 'Bulk approve'}
                    </Button>
                    <Button
                        onClick={onBulkReject}
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
                                onChange={onToggleSelectAll}
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
                                    onChange={() => onToggleSelectOne(ts.id)}
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
                    <span className="ml-2 text-xs text-gray-400">
                        ({pagination.from}-{pagination.to} of {pagination.total})
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onGoToPage(1)}
                        disabled={pagination.current_page <= 1}
                    >
                        First
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => onGoToPage(pagination.current_page - 1)}
                        disabled={pagination.current_page <= 1}
                    >
                        Previous
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => onGoToPage(pagination.current_page + 1)}
                        disabled={pagination.current_page >= pagination.last_page}
                    >
                        Next
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onGoToPage(pagination.last_page)}
                        disabled={pagination.current_page >= pagination.last_page}
                    >
                        Last
                    </Button>
                </div>
            </div>
        </div>
    );
}
