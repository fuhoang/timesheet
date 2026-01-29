import React from 'react';
import { formatMinutes, formatTime } from '../utils/time';

export default function DayCard({ day, isToday, submitted }) {
    return (
        <div className={`rounded-2xl shadow border overflow-hidden
            ${isToday ? 'bg-blue-50 border-blue-400' : 'bg-white'}`}>

            <div className="px-6 py-4 border-b flex justify-between">
                <div className="font-medium">
                    {day.label}
                    {isToday && (
                        <span className="ml-2 text-xs bg-blue-600 text-white px-2 rounded-full">
                            Today
                        </span>
                    )}
                </div>
                <div className="font-semibold">
                    {formatMinutes(day.total_minutes)}
                </div>
            </div>

            {day.entries.length === 0 ? (
                <div className="px-6 py-4 text-sm text-gray-400">
                    No entries
                </div>
            ) : (
                <div className="divide-y relative">
                    {day.entries.map(entry => (
                        <div key={entry.id} className="px-6 py-4 flex justify-between text-sm">
                            <div>
                                <div className="font-medium">
                                    {entry.project?.name ?? 'No project'}
                                </div>
                                <div className="text-gray-500">
                                    {entry.description}
                                </div>
                            </div>

                            <div className="text-right">
                                <div>
                                    {formatTime(entry.started_at)} – {entry.ended_at
                                        ? formatTime(entry.ended_at)
                                        : 'Running'}
                                </div>
                                <div className="font-semibold">
                                    {formatMinutes(entry.duration_minutes)}
                                </div>
                            </div>
                        </div>
                    ))}

                    {submitted && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center font-semibold">
                            Week submitted — locked
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
