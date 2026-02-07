import React from 'react';

export default function StatusBadge({ status, className = '' }) {
    const styles = {
        resubmitted: 'bg-blue-100 text-blue-800',
        draft: 'bg-gray-100 text-gray-700',
        submitted: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
    };

    const label = status === 'resubmitted' ? 'resubmitted' : status;

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[label] || styles[status]} ${className}`}>
            {label}
        </span>
    );
}
