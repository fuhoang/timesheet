import React from 'react';
import Button from '../../../components/ui/Button';

export default function ProjectTable({ projects, api, reloadProjects, setEditingProject, showToast }) {
    async function deleteProject(id) {
        if (!confirm('Delete this project?')) return;

        try {
            await api({ method: 'delete', url: `/api/admin/projects/${id}` });
            await reloadProjects();
            showToast('Project deleted');
        } catch (err) {
            showToast('Failed to delete project', 'error');
        }
    }

    if (!projects || projects.length === 0) {
        return (
            <div className="p-6 text-gray-500">
                <div className="text-sm font-semibold text-gray-900">
                    No projects yet
                </div>
                <div className="mt-1 text-sm text-gray-500">
                    Create a project to start tracking time.
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow border overflow-hidden">
            <div className="p-4 font-semibold border-b">Projects</div>
            <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="text-left px-4 py-3">Name</th>
                        <th className="text-left px-4 py-3">Description</th>
                        <th className="text-right px-4 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {projects.map(project => (
                        <tr key={project.id}>
                            <td className="px-4 py-3 font-medium">{project.name}</td>
                            <td className="px-4 py-3 text-gray-600">{project.description || '—'}</td>
                            <td className="px-4 py-3 text-right space-x-2">
                                <Button
                                    onClick={() => setEditingProject(project)}
                                    variant="link"
                                    size="xs"
                                >
                                    Edit
                                </Button>
                                <Button
                                    onClick={() => deleteProject(project.id)}
                                    variant="link-danger"
                                    size="xs"
                                >
                                    Delete
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
