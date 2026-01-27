import React, { useEffect, useState } from 'react';
import { useApi } from '../../context/ApiContext';
import { useProjects } from '../../context/ProjectContext';


export default function AdminProjects() {
    const { api } = useApi();
    const { projects, loading, reloadProjects } = useProjects();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState(null);

    const [editingProject, setEditingProject] = useState(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [updating, setUpdating] = useState(false);
    const [editErrors, setEditErrors] = useState({});

    function showToast(message, type = 'success') {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }

    async function createProject(e) {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        setErrors({});
        try {
            
            await api({
                method: 'post',
                url: '/api/projects',
                data: { name, description }
            }); 
            setName('');
            setDescription('');
            await reloadProjects();
            showToast('Project created successfully');

        } catch (err) {
            const status = err.response?.status;

            // auto retry once after auth boot
            if (status === 401 && retry && user) {
                return api(config, { ...options, retry: false });
            }

            const normalizedError = {
                status,
                message:
                    err.response?.data?.message ||
                    err.message ||
                    'Request failed',
                errors: err.response?.data?.errors || null,
            };

            setError(normalizedError);
            throw normalizedError;
        } finally {
                setSaving(false);
            }
        }

    async function deleteProject(id) {
        if (!confirm('Delete this project?')) return;
        try {
            await api({
                method: 'delete',
                url: `/api/projects/${id}`,
            });

            await reloadProjects();
            showToast('Project deleted');
        } catch (err) {
            showToast('Failed to delete project', 'error');
        }
    }

    function openEdit(project) {
        setEditingProject(project);
        setEditName(project.name);
        setEditDescription(project.description || '');
        setEditErrors({});
    }

    async function saveEdit() {
        if (!editName.trim()) return;
        setUpdating(true);
        setEditErrors({});
        try {
            await api({
                method: 'patch',
                url: `/api/projects/${editingProject.id}`,
                data: {
                    name: editName,
                    description: editDescription,
                },
            });

            setEditingProject(null);
            await reloadProjects();
            showToast('Project updated successfully');
        } catch (err) {
            if (err.response?.status === 422) {
                setEditErrors(err.response.data.errors || {});
            } else {
                showToast('Failed to update project', 'error');
            }
        } finally {
            setUpdating(false);
        }
    }

    return (
        <div className="space-y-6 relative">

            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-4 right-4 px-4 py-2 rounded-lg text-white shadow-lg z-50
                    ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}
                >
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow border">
                <h1 className="text-2xl font-semibold">
                    Admin · Projects
                </h1>
                <p className="text-gray-600 mt-1">
                    Manage all company projects
                </p>
            </div>

            {/* Create project */}
            <div className="bg-white p-6 rounded-2xl shadow border">
                <h2 className="font-semibold mb-4">
                    Create project
                </h2>

                <form
                    onSubmit={createProject}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    <div className="flex flex-col">
                        <input
                            type="text"
                            placeholder="Project name"
                            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                        {errors.name && (
                            <p className="text-red-600 text-sm mt-1">{errors.name[0]}</p>
                        )}
                    </div>

                    <div className="flex flex-col">
                        <input
                            type="text"
                            placeholder="Description (optional)"
                            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                        {errors.description && (
                            <p className="text-red-600 text-sm mt-1">{errors.description[0]}</p>
                        )}
                    </div>

                    <button
                        disabled={saving}
                        className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-60"
                    >
                        {saving ? 'Saving…' : 'Add project'}
                    </button>
                </form>
            </div>

            {/* Projects table */}
            <div className="bg-white rounded-2xl shadow border overflow-hidden">
                <div className="p-4 font-semibold border-b">
                    Projects
                </div>

                {loading ? (
                    <div className="p-6 text-gray-500">Loading projects…</div>
                ) : projects.length === 0 ? (
                    <div className="p-6 text-gray-500">No projects yet.</div>
                ) : (
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
                                        <button
                                            onClick={() => openEdit(project)}
                                            className="text-indigo-600 hover:underline"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deleteProject(project.id)}
                                            className="text-red-600 hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Edit Modal */}
            {editingProject && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                    <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
                        <h3 className="text-lg font-semibold mb-4">Edit Project</h3>

                        <div className="space-y-3">
                            <div className="flex flex-col">
                                <input
                                    type="text"
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                />
                                {editErrors.name && (
                                    <p className="text-red-600 text-sm mt-1">{editErrors.name[0]}</p>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <input
                                    type="text"
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
                                    value={editDescription}
                                    onChange={e => setEditDescription(e.target.value)}
                                />
                                {editErrors.description && (
                                    <p className="text-red-600 text-sm mt-1">{editErrors.description[0]}</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end space-x-2">
                            <button
                                onClick={() => setEditingProject(null)}
                                className="px-4 py-2 rounded-lg border hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveEdit}
                                disabled={updating}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                                {updating ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
