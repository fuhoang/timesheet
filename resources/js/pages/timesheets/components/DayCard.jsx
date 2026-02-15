import React, { useEffect, useMemo, useState } from 'react';
import { useApi } from '../../../context/ApiContext';
import { formatMinutes } from '../utils/time';
import Button from '../../../components/ui/Button';

export default function DayCard({ day, isToday, locked, onUpdated }) {
    const { api } = useApi();
    const [editingId, setEditingId] = useState(null);
    const [description, setDescription] = useState('');
    const [minutes, setMinutes] = useState('');
    const [projectId, setProjectId] = useState('');
    const [entries, setEntries] = useState(day.entries || []);

    const isRejected = day.status === 'rejected';

    useEffect(() => {
        setEntries(day.entries || []);
    }, [day.entries]);

    const displayedTotalMinutes = useMemo(
        () => entries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0),
        [entries]
    );

    function startEdit(entry) {
        setProjectId(entry.project_id);
        setEditingId(entry.id);
        setDescription(entry.description || '');
        setMinutes(entry.duration_minutes || 0);
    }

    async function saveEdit(entryId) {
        const previousEntries = entries;
        const nextDuration = Number(minutes);

        setEntries(prev => prev.map(entry => (
            entry.id === entryId
                ? { ...entry, project_id: projectId, description, duration_minutes: nextDuration }
                : entry
        )));

        setEditingId(null);

        try {
            await api({
                method: 'patch',
                url: `/api/time-entries/${entryId}`,
                data: {
                    project_id: projectId,
                    description,
                    duration_minutes: nextDuration,
                },
            });

            if (onUpdated) {
                await onUpdated();
            }
        } catch (error) {
            setEntries(previousEntries);
            alert(error?.response?.data?.message || 'Unable to save entry');
        }
    }

    return (
        <div
            id={`day-${day.date}`}
            className={`
                relative rounded-2xl shadow border
                ${isToday && !isRejected ? 'bg-blue-50 border-blue-400' : 'bg-white'}
                ${isRejected ? 'border-red-300 border-l-4 border-l-red-600 dark:border-red-500 dark:border-l-red-400' : ''}
            `}
        >

            {/* Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center">
                <div className="font-medium flex items-center gap-2">
                    {day.label}

                    {isToday && !isRejected && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                            Today
                        </span>
                    )}

                    {isRejected && (
                        <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                            Rejected
                        </span>
                    )}
                </div>

                <div className="font-semibold">
                    {formatMinutes(displayedTotalMinutes)}
                </div>
            </div>

            {/* Rejection reason */}
            {isRejected && day.rejection_reason && (
                <div className="px-6 py-3 text-sm bg-red-100 text-red-800 border-b">
                    <strong>Reason:</strong> {day.rejection_reason}
                </div>
            )}

            {/* Entries */}
            {entries.length === 0 ? (
                <div className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    No entries yet
                </div>
            ) : (
                <div className="divide-y">
                    {entries.map(entry => (
                        <div
                            key={entry.id}
                            className={`
                                px-6 py-4 text-sm flex justify-between gap-4
                                transition-colors
                                ${
                                    editingId === entry.id
                                        ? 'bg-yellow-50 dark:bg-transparent dark:border dark:border-yellow-400'
                                        : ''
                                }
                            `}
                        >
                            {/* Left */}
                            <div className="flex-1">
                                <div className="font-medium">
                                    {entry.project?.name ?? 'No project'}
                                </div>

                                {editingId === entry.id ? (
                                    <input
                                        className="mt-1 w-full border rounded px-2 py-1"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                ) : (
                                    <div className="text-gray-600 dark:text-gray-300">
                                        {entry.description || '—'}
                                    </div>
                                )}
                            </div>

                            {/* Right */}
                            <div className="text-right min-w-140">
                                {editingId === entry.id ? (
                                    <>
                                        <input
                                            type="number"
                                            className="w-20 border rounded px-2 py-1"
                                            value={minutes}
                                            onChange={e => setMinutes(e.target.value)}
                                        />
                                        <div className="mt-2 space-x-2">
                                            <Button
                                                onClick={() => saveEdit(entry.id)}
                                                variant="link-success"
                                                size="xs"
                                            >
                                                Save
                                            </Button>
                                            <Button
                                                onClick={() => setEditingId(null)}
                                                variant="link-muted"
                                                size="xs"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="font-semibold">
                                            {formatMinutes(entry.duration_minutes)}
                                        </div>

                                        {(!locked || isRejected) && (
                                            <Button
                                                onClick={() => startEdit(entry)}
                                                variant="link"
                                                size="xs"
                                                className="mt-1"
                                            >
                                                Edit
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lock overlay */}
            {locked && !isRejected && (
                <div className="absolute inset-0 bg-white/40 dark:bg-white/60 backdrop-blur-md rounded-2xl flex items-center justify-center font-semibold text-gray-900 dark:text-black pointer-events-none">
                    Timesheet locked
                </div>
            )}
        </div>
    );
}

/* helpers */
