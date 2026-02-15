import React from 'react';

export default function InlineAlert({ type = 'error', children, requestId = null }) {
    const styles = {
        error: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200',
        success: 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200',
        warning: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900/60 dark:bg-yellow-950/40 dark:text-yellow-200',
        info: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200',
    };

    async function copyRequestId() {
        if (!requestId) return;
        try {
            await navigator.clipboard.writeText(requestId);
        } catch {
            // Ignore clipboard failures.
        }
    }

    return (
        <div className={`rounded-2xl border p-4 text-sm ${styles[type] || styles.error}`}>
            {children}
            {requestId && (
                <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs opacity-90">Request ID: {requestId}</span>
                    <button
                        type="button"
                        onClick={copyRequestId}
                        className="text-xs px-2 py-1 rounded border border-current/30 hover:bg-black/5"
                    >
                        Copy
                    </button>
                </div>
            )}
        </div>
    );
}
