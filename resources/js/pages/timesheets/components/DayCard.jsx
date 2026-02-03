import React, { useState } from 'react';
import { useApi } from '../../../context/ApiContext';

export default function DayCard({ day, isToday, locked, onUpdated, isWeekRejected }) {
    const { api } = useApi();
    const [editingId, setEditingId] = useState(null);
    const [description, setDescription] = useState('');
    const [minutes, setMinutes] = useState('');
    const [projectId, setProjectId] = useState('');

    const isRejected = isWeekRejected;


    // Need to think if indivdual entries show be highlighted because admin reject individual entires
    // or reject weekly instead of individual entries.

    function startEdit(entry) {
        console.log(entry);
        setProjectId(entry.project_id);
        setEditingId(entry.id);
        setDescription(entry.description || '');
        setMinutes(entry.duration_minutes || 0);
    }

    async function saveEdit(entryId) {
        await api({
            method: 'patch',
            url: `/api/time-entries/${entryId}`,
            data: {
                project_id: projectId,
                description,
                duration_minutes: Number(minutes),
            },
        });

        setEditingId(null);

        // 🔄 REFRESH WEEK STATE
        if (onUpdated) {
            await onUpdated();
        }
    }

    // console.log('Day status:', day.status);
    // console.log('Day status:', day.timesheet_status);

    // console.log(entry);

    return (
        <div
            className={`
                relative rounded-2xl shadow border
                ${isToday && !isRejected ? 'bg-blue-50 border-blue-400' : 'bg-white'}
                ${isRejected ? 'border-red-300' : ''}
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
                    {formatMinutes(day.total_minutes)}
                </div>
            </div>

            {/* Entries */}
            {day.entries.length === 0 ? (
                <div className="px-6 py-4 text-sm text-gray-400">
                    No entries
                </div>
            ) : (
                <div className="divide-y">
                    {day.entries.map(entry => (
                        <div
                            key={entry.id}
                            className={`
                                px-6 py-4 text-sm flex justify-between gap-4
                                transition-colors
                                ${
                                    isRejected
                                        ? 'bg-red-100 border-l-4 border-red-600'
                                        : ''
                                }
                                ${
                                    editingId === entry.id
                                        ? 'bg-yellow-50'
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
                                    <div className="text-gray-500">
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
                                            <button
                                                onClick={() => saveEdit(entry.id)}
                                                className="text-green-600 hover:underline"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="text-gray-500 hover:underline"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="font-semibold">
                                            {formatMinutes(entry.duration_minutes)}
                                        </div>

                                        {!locked && (
                                            <button
                                                onClick={() => startEdit(entry)}
                                                className="text-indigo-600 hover:underline mt-1"
                                            >
                                                Edit
                                            </button>
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
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center font-semibold text-gray-700 pointer-events-none">
                    Timesheet locked
                </div>
            )}
        </div>
    );
}

/* helpers */
function formatMinutes(minutes = 0) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
}
