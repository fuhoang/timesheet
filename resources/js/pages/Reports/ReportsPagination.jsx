import React from 'react';

export default function ReportsPagination({ page, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between">
            <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700"
            >
                Previous
            </button>
            <div className="text-sm text-gray-500 dark:text-gray-300">
                Page {page} of {totalPages}
            </div>
            <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700"
            >
                Next
            </button>
        </div>
    );
}
