import React from 'react';

export default function StatusBadge({ status, className = '' }) {
    const styles = {
        resubmitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
        draft: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-200',
        submitted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
        approved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
        rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
    };

    const label = status === 'resubmitted' ? 'resubmitted' : status;

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[label] || styles[status]} ${className}`}>
            {label}
        </span>
    );
}
