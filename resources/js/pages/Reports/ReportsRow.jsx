import React from 'react';

export default function ReportsRow({ row, formatMinutes, formatHours }) {
    return (
        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-lg font-semibold text-gray-900">
                        {row.user?.name ?? 'Unknown user'}
                    </div>
                    <div className="text-sm text-gray-500">
                        {row.user?.email ?? 'No email'}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs uppercase text-gray-400">Total</div>
                    <div className="text-lg font-semibold text-gray-900">
                        {formatMinutes(row.total_minutes)}
                        <span className="text-sm text-gray-400"> ({formatHours(row.total_minutes)})</span>
                    </div>
                </div>
            </div>

            {row.projects?.length > 0 && (
                <div>
                    <div className="text-xs uppercase text-gray-400 mb-2">Project totals</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {row.projects.map(project => (
                            <div
                                key={`${row.user?.id ?? 'user'}-project-${project.id ?? project.name}`}
                                className="rounded-lg border border-gray-100 bg-white px-4 py-3 flex items-center justify-between"
                            >
                                <div className="text-sm font-medium text-gray-700">
                                    {project.name}
                                </div>
                                <div className="text-sm font-semibold text-gray-900">
                                    {formatMinutes(project.total_minutes)}
                                    <span className="text-xs text-gray-400"> ({formatHours(project.total_minutes)})</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {row.days.map(day => (
                    <div
                        key={`${row.user?.id ?? 'user'}-${day.date}`}
                        className={`rounded-lg border px-4 py-3 flex items-center justify-between ${
                            day.status === 'rejected'
                                ? 'border-red-200 bg-red-50'
                                : day.status === 'draft'
                                    ? 'border-amber-200 bg-amber-50'
                                    : day.status === 'submitted'
                                        ? 'border-blue-200 bg-blue-50'
                                        : day.status === 'approved'
                                            ? 'border-emerald-200 bg-emerald-50'
                                            : 'border-gray-100 bg-gray-50'
                        }`}
                    >
                        <div className="text-sm font-medium text-gray-700">
                            {day.date}
                            {day.status && (
                                <span className="ml-2 text-[11px] uppercase text-gray-400">
                                    {day.status}
                                </span>
                            )}
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                            {formatMinutes(day.total_minutes)}
                        </div>
                    </div>
                ))}
                <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-700">Total</div>
                    <div className="text-sm font-semibold text-gray-900">
                        {formatMinutes(row.total_minutes)}
                        <span className="text-xs text-gray-400"> ({formatHours(row.total_minutes)})</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
