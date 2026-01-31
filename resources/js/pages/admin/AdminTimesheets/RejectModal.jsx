import React, { useState } from 'react';
import { useApi } from '../../../context/ApiContext';

export default function RejectModal({ timesheetId, onClose, onDone }) {
    const { api } = useApi();
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);

    async function submit() {
        setSaving(true);
        await api({
            method: 'post',
            url: `/api/admin/timesheets/${timesheetId}/reject`,
            data: { reason },
        });
        onDone();
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow w-full max-w-md">
                <h3 className="text-lg font-semibold mb-3">Reject timesheet</h3>

                <textarea
                    className="w-full border rounded-lg p-2"
                    rows={4}
                    placeholder="Reason for rejection"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                />

                <div className="mt-4 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 border rounded-lg">
                        Cancel
                    </button>
                    <button
                        onClick={submit}
                        disabled={saving || !reason.trim()}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
                    >
                        Reject
                    </button>
                </div>
            </div>
        </div>
    );
}
