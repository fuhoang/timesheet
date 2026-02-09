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
        <div className="space-y-3">
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
