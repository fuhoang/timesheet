import React from 'react';
import Button from '../../../components/ui/Button';

export default function AdminUsersList({
    users,
    projects,
    selected,
    bulkUsers,
    savingUserId,
    onToggleBulkUser,
    onSaveUser,
    onToggleProject,
}) {
    return (
        <div className="space-y-4">
            {users.map(user => (
                <div key={user.id} className="bg-white rounded-2xl shadow border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-semibold text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {projects.map(project => {
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
                    </div>
                </div>
            ))}
        </div>
    );
}
