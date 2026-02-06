import React from 'react';

export default function InlineAlert({ type = 'error', children }) {
    const styles = {
        error: 'border-red-200 bg-red-50 text-red-700',
        success: 'border-green-200 bg-green-50 text-green-700',
        warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
        info: 'border-blue-200 bg-blue-50 text-blue-700',
    };

    return (
        <div className={`rounded-2xl border p-4 text-sm ${styles[type] || styles.error}`}>
            {children}
        </div>
    );
}
