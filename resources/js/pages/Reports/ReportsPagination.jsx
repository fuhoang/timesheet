import React from 'react';
import { ui } from '../../components/ui/themeClasses';

export default function ReportsPagination({ page, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between">
            <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className={`${ui.buttonSecondary} disabled:opacity-50`}
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
                className={`${ui.buttonSecondary} disabled:opacity-50`}
            >
                Next
            </button>
        </div>
    );
}
