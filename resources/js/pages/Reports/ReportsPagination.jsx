import React from 'react';

export default function ReportsPagination({ page, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between">
            <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
            >
                Previous
            </button>
            <div className="text-sm text-gray-500">
                Page {page} of {totalPages}
            </div>
            <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
            >
                Next
            </button>
        </div>
    );
}
