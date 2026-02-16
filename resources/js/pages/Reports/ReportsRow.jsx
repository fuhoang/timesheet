import React from 'react';
import { ui } from '../../components/ui/themeClasses';

export default function ReportsRow({ row, formatMinutes, formatHours }) {
    function dayStatusClass(status) {
        if (status === 'rejected') return 'reports-day reports-day-rejected';
        if (status === 'draft') return 'reports-day reports-day-draft';
        if (status === 'submitted') return 'reports-day reports-day-submitted';
        if (status === 'approved') return 'reports-day reports-day-approved';
        return 'reports-day';
    }

    return (
        <div className={`${ui.panel} p-5 space-y-4 reports-row`}>
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {row.user?.name ?? 'Unknown user'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-300">
                        {row.user?.email ?? 'No email'}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs uppercase text-gray-400 dark:text-gray-500">Total</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {formatMinutes(row.total_minutes)}
                        <span className="text-sm text-gray-400 dark:text-gray-500"> ({formatHours(row.total_minutes)})</span>
                    </div>
                </div>
            </div>

            {row.projects?.length > 0 && (
                <div>
                    <div className="text-xs uppercase text-gray-400 dark:text-gray-500 mb-2">Project totals</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {row.projects.map(project => (
                            <div
                                key={`${row.user?.id ?? 'user'}-project-${project.id ?? project.name}`}
                                className="rounded-lg border border-gray-100 bg-white px-4 py-3 flex items-center justify-between dark:border-slate-600 dark:bg-slate-800"
                            >
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {project.name}
                                </div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {formatMinutes(project.total_minutes)}
                                    <span className="text-xs text-gray-400 dark:text-gray-500"> ({formatHours(project.total_minutes)})</span>
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
                        className={`rounded-lg border px-4 py-3 flex items-center justify-between ${dayStatusClass(day.status)}`}
                    >
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            {day.date}
                            {day.status && (
                                <span className="ml-2 text-[11px] uppercase text-gray-400 dark:text-gray-500">
                                    {day.status}
                                </span>
                            )}
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {formatMinutes(day.total_minutes)}
                        </div>
                    </div>
                ))}
                <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 flex items-center justify-between dark:border-slate-600 dark:bg-slate-800">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Total</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatMinutes(row.total_minutes)}
                        <span className="text-xs text-gray-400 dark:text-gray-500"> ({formatHours(row.total_minutes)})</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
