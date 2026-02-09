import React from 'react';

export default function AdminUsersAuditLog({ logs, formatProjectList }) {
    if (!logs || logs.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow border p-4 space-y-3">
            <div className="text-sm font-semibold text-gray-900">Recent assignment changes</div>
            <div className="space-y-2 text-sm text-gray-600">
                {logs.map(log => (
                    <div key={log.id} className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-gray-800">
                                {log.admin?.name ?? 'Admin'}
                            </span>
                            <span>updated</span>
                            <span className="font-medium text-gray-800">
                                {log.user?.name ?? 'User'}
                            </span>
                            <span className="text-xs text-gray-400">
                                {new Date(log.created_at).toLocaleString()}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500">
                            Before: {formatProjectList(log.before_project_ids)} → After: {formatProjectList(log.after_project_ids)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
