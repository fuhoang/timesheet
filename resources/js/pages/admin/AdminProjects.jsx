import React, { useEffect, useState } from 'react';
import axios from '../../lib/axios';

export default function AdminProjects() {
    const [projects, setProjects] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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

    async function createProject(e) {
        e.preventDefault();

        if (!name.trim()) return;

        setSaving(true);

        try {
            await axios.post('/api/projects', {
                name,
                description,
            });

            setName('');
            setDescription('');
            loadProjects();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    }

    async function deleteProject(id) {
        if (!confirm('Delete this project?')) return;

        try {
            await axios.delete(`/api/projects/${id}`);
            setProjects(projects.filter(p => p.id !== id));
        } catch (err) {
            console.error(err);
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
                    <div className="p-6 text-gray-500">
                        Loading projects…
                    </div>
                ) : projects.length === 0 ? (
                    <div className="p-6 text-gray-500">
                        No projects yet.
                    </div>
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
                                    <td className="px-4 py-3 font-medium">
                                        {project.name}
                                    </td>

                                    <td className="px-4 py-3 text-gray-600">
                                        {project.description || '—'}
                                    </td>

                                    <td className="px-4 py-3 text-right">
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
        </div>
    );
}
