import React from 'react';
import Button from '../../../components/ui/Button';

export default function AdminUsersList({
    users,
    projects,
    selected,
    assignedOnly,
    bulkUsers,
    savingUserId,
    onToggleBulkUser,
    onSaveUser,
    onToggleProject,
    onSelectAllProjectsForUser,
    onClearProjectsForUser,
}) {
    return (
        <div className="space-y-4">
            {users.map(user => {
                const visibleProjects = assignedOnly
                    ? projects.filter(project => selected[user.id]?.has(project.id))
                    : projects;

                return (
                <div key={user.id} className="bg-white rounded-2xl shadow border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-semibold text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                        <div className="text-xs text-gray-500">
                            {selected[user.id]?.size ?? 0} of {projects.length} projects
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-500">
                            <input
                                type="checkbox"
                                checked={bulkUsers.has(user.id)}
                                onChange={() => onToggleBulkUser(user.id)}
                            />
                            Select
                        </label>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onSaveUser(user.id)}
                            disabled={savingUserId === user.id}
                        >
                            {savingUserId === user.id ? 'Saving…' : 'Save'}
                        </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectAllProjectsForUser(user.id)}
                            disabled={projects.length === 0 || selected[user.id]?.size === projects.length}
                        >
                            Select all
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onClearProjectsForUser(user.id)}
                            disabled={!selected[user.id]?.size}
                        >
                            Clear
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {visibleProjects.map(project => {
                            const checked = selected[user.id]?.has(project.id);
                            return (
                                <label
                                    key={project.id}
                                    className="flex items-center gap-2 text-sm text-gray-700"
                                >
                                    <input
                                        type="checkbox"
                                        checked={!!checked}
                                        onChange={() => onToggleProject(user.id, project.id)}
                                    />
                                    {project.name}
                                </label>
                            );
                        })}
                        {assignedOnly && visibleProjects.length === 0 && (
                            <div className="text-xs text-gray-500">No assigned projects for this user.</div>
                        )}
                    </div>
                </div>
            )})}
        </div>
    );
}
