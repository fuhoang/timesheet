import React from 'react';
import Button from '../../../components/ui/Button';

export default function AdminUsersBulkProjects({
    projects,
    bulkProjects,
    onToggleProject,
    bulkSaving,
    bulkUsersCount,
    onAdd,
    onRemove,
    onReplace,
}) {
    return (
        <div className="bg-white rounded-2xl shadow border p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <div className="text-sm font-medium text-gray-900">Bulk project assignment</div>
                    <div className="text-xs text-gray-500">
                        {bulkProjects.size} project{bulkProjects.size === 1 ? '' : 's'} selected
                    </div>
                </div>
            </div>

            {projects.length === 0 ? (
                <div className="text-sm text-gray-500">
                    No projects match the current filter.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {projects.map(project => (
                        <label
                            key={`bulk-project-${project.id}`}
                            className="flex items-center gap-2 text-sm text-gray-700"
                        >
                            <input
                                type="checkbox"
                                checked={bulkProjects.has(project.id)}
                                onChange={() => onToggleProject(project.id)}
                            />
                            {project.name}
                        </label>
                    ))}
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                <Button
                    variant="primary"
                    size="sm"
                    disabled={bulkSaving || !bulkUsersCount}
                    onClick={onAdd}
                >
                    {bulkSaving ? 'Applying…' : 'Add selected projects'}
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    disabled={bulkSaving || !bulkUsersCount}
                    onClick={onRemove}
                >
                    Remove selected projects
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={bulkSaving || !bulkUsersCount}
                    onClick={onReplace}
                >
                    Replace with selected projects
                </Button>
            </div>
        </div>
    );
}
