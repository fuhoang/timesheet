import React, { useState } from 'react';

export default function RejectModal({
    open,
    onClose,
    onConfirm,
    loading = false,
    error = null,
}) {
    const [reason, setReason] = useState('');

    if (!open) return null;

    function submit() {
        onConfirm(reason);
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
                <h3 className="text-lg font-semibold mb-2">
                    Reject Timesheet
                </h3>

                <p className="text-sm text-gray-600 mb-4">
                    Provide a reason for rejection.
                </p>

                <textarea
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
                    rows={4}
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Reason for rejection"
                />

                {error && (
                    <p className="text-red-600 text-sm mt-2">{error}</p>
                )}

                <div className="mt-4 flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border hover:bg-gray-100"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={submit}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                    >
                        {loading ? 'Rejecting…' : 'Reject'}
                    </button>
                </div>
            </div>
        </div>
    );
}
