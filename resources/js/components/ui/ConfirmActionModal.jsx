import React, { useEffect, useState } from 'react';
import Button from './Button';

export default function ConfirmActionModal({
    open,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    requireReason = false,
    reasonLabel = 'Reason',
    reasonPlaceholder = 'Enter reason...',
    loading = false,
    error = null,
    onClose,
    onConfirm,
}) {
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (open) {
            setReason('');
        }
    }, [open]);

    if (!open) return null;

    async function submit() {
        const value = reason.trim();
        if (requireReason && value === '') return;
        await onConfirm(value);
    }

    function handleKeyDown(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            if (!loading) onClose();
            return;
        }

        if (event.key === 'Enter' && !event.shiftKey) {
            const isTextarea = event.target instanceof HTMLElement && event.target.tagName === 'TEXTAREA';
            if (isTextarea && !event.metaKey && !event.ctrlKey) {
                return;
            }
            event.preventDefault();
            if (!loading) {
                submit();
            }
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onKeyDown={handleKeyDown}>
            <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                {message && (
                    <p className="mt-2 text-sm text-gray-600">{message}</p>
                )}

                {requireReason && (
                    <div className="mt-4">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            {reasonLabel}
                        </label>
                        <textarea
                            rows={4}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring"
                            placeholder={reasonPlaceholder}
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                        />
                    </div>
                )}

                {error && (
                    <p className="mt-3 text-sm text-red-600">{error}</p>
                )}

                <div className="mt-5 flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={submit}
                        disabled={loading || (requireReason && reason.trim() === '')}
                    >
                        {loading ? 'Working...' : confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}
