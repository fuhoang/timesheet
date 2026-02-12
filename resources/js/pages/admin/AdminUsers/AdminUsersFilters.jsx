import React from 'react';
import Button from '../../../components/ui/Button';

export default function AdminUsersFilters({
    userQuery,
    roleFilter,
    projectQuery,
    perPage,
    onUserQueryChange,
    onRoleFilterChange,
    onProjectQueryChange,
    onPerPageChange,
    onSelectFilteredUsers,
    selectedCount,
    paginationSummary,
}) {
    return (
        <div className="bg-white rounded-2xl shadow border p-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                    <div className="text-xs uppercase text-gray-500">User filters</div>
                    <div className="flex flex-wrap items-center gap-3">
                        <input
                            type="text"
                            value={userQuery}
                            onChange={event => onUserQueryChange(event.target.value)}
                            placeholder="Search users"
                            className="w-full md:w-64 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                        <select
                            value={roleFilter}
                            onChange={event => onRoleFilterChange(event.target.value)}
                            className="w-full md:w-48 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        >
                            <option value="">All roles</option>
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
                        </select>
                        <select
                            value={perPage}
                            onChange={event => onPerPageChange(Number(event.target.value))}
                            className="w-full md:w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        >
                            <option value={10}>10 / page</option>
                            <option value={20}>20 / page</option>
                            <option value={50}>50 / page</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="text-xs uppercase text-gray-500">Project filters</div>
                    <div className="flex flex-wrap items-center gap-3">
                        <input
                            type="text"
                            value={projectQuery}
                            onChange={event => onProjectQueryChange(event.target.value)}
                            placeholder="Search projects"
                            className="w-full md:w-64 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={onSelectFilteredUsers}
                            disabled={selectedCount === 0}
                        >
                            Select filtered users
                        </Button>
                        <div className="text-xs text-gray-500">
                            Selected: {selectedCount}
                        </div>
                    </div>
                </div>
            </div>

            {paginationSummary && (
                <div className="text-xs text-gray-400">{paginationSummary}</div>
            )}
        </div>
    );
}
