import React from 'react';
import Button from '../../../components/ui/Button';

export default function AdminTimesheetsFilters({
    filters,
    perPage,
    onUpdateFilter,
    onPerPageChange,
    onApply,
    onClear,
}) {
    return (
        <form
            onSubmit={onApply}
            className="bg-white p-4 rounded-2xl shadow border flex flex-wrap gap-4 items-end"
        >
            <div className="flex flex-col">
                <label className="text-xs text-gray-500">Status</label>
                <select
                    value={filters.status}
                    onChange={e => onUpdateFilter('status', e.target.value)}
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
                    onChange={e => onUpdateFilter('q', e.target.value)}
                    placeholder="Name or email"
                    className="border rounded-lg px-3 py-2"
                />
            </div>

            <div className="flex flex-col">
                <label className="text-xs text-gray-500">From</label>
                <input
                    type="date"
                    value={filters.date_from}
                    onChange={e => onUpdateFilter('date_from', e.target.value)}
                    className="border rounded-lg px-3 py-2"
                />
            </div>

            <div className="flex flex-col">
                <label className="text-xs text-gray-500">To</label>
                <input
                    type="date"
                    value={filters.date_to}
                    onChange={e => onUpdateFilter('date_to', e.target.value)}
                    className="border rounded-lg px-3 py-2"
                />
            </div>

            <div className="flex flex-col">
                <label className="text-xs text-gray-500">Per page</label>
                <select
                    value={perPage}
                    onChange={e => onPerPageChange(Number(e.target.value))}
                    className="border rounded-lg px-3 py-2"
                >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                </select>
            </div>

            <Button type="submit" variant="primary">
                Apply
            </Button>
            <Button type="button" onClick={onClear} variant="secondary">
                Clear
            </Button>
        </form>
    );
}
