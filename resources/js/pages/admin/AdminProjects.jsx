import React, { useEffect, useState } from 'react';
import axios from '../../lib/axios';

export default function AdminProjects() {
    const [projects, setProjects] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Edit modal state
    const [editingProject, setEditingProject] = useState(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        loadProjects();
    }, []);

    async function loadProjects() {
        try {
            const res = await axios.get('/api/projects');
            setProjects(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    // Create project
    async function createProject(e) {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        try {
            await axios.post('/api/projects', { name, description });
            setName('');
            setDescription('');
            loadProjects();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    }

    // Delete project
    async function deleteProject(id) {
        if (!confirm('Delete this project?')) return;
        try {
            await axios.delete(`/api/projects/${id}`);
            setProjects(projects.filter(p => p.id !== id));
        } catch (err) {
            console.error(err);
        }
    }

    // Open edit modal
    function openEdit(project) {
        setEditingProject(project);
        setEditName(project.name);
        setEditDescription(project.description || '');
    }

    // Save edits
    async function saveEdit() {
        if (!editName.trim()) return;
        setUpdating(true);
        try {
            await axios.put(`/api/projects/${editingProject.id}`, {
                name: editName,
                description: editDescription,
            });
            setEditingProject(null);
            loadProjects();
        } catch (err) {
            console.error(err);
        } finally {
            setUpdating(false);
        }
    }

    return (
        <div className="space-y-6">

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
                    <input
                        type="text"
                        placeholder="Project name"
                        className="border rounded-lg px-3 py-2 focus:outline-none focus:ring"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Description (optional)"
                        className="border rounded-lg px-3 py-2 focus:outline-none focus:ring"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
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
                            <input
                                type="text"
                                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                            />
                            <input
                                type="text"
                                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
                                value={editDescription}
                                onChange={e => setEditDescription(e.target.value)}
                            />
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
