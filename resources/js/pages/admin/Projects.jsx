import React, { useEffect, useState } from 'react';
import axios from '../../lib/axios';

export default function Projects() {
    const [projects, setProjects] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        const res = await axios.get('/api/projects');
        setProjects(res.data);
        setLoading(false);
    }

    async function create(e) {
        e.preventDefault();

        await axios.post('/api/projects', {
            name,
            description,
        });

        setName('');
        setDescription('');
        load();
    }

    async function remove(id) {
        if (!confirm('Delete project?')) return;

        await axios.delete(`/api/projects/${id}`);
        load();
    }

    return (
        <div className="space-y-6">

            <h1 className="text-2xl font-semibold">
                Projects
            </h1>

            {/* Create */}
            <form
                onSubmit={create}
                className="bg-white p-6 rounded-xl border shadow space-y-4"
            >
                <div>
                    <label className="block text-sm font-medium">
                        Project name
                    </label>
                    <input
                        className="mt-1 w-full border rounded px-3 py-2"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">
                        Description
                    </label>
                    <textarea
                        className="mt-1 w-full border rounded px-3 py-2"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                </div>

                <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Create project
                </button>
            </form>

            {/* List */}
            <div className="bg-white rounded-xl border shadow divide-y">
                {loading && (
                    <div className="p-4 text-gray-500">
                        Loading…
                    </div>
                )}

                {projects.map(project => (
                    <div
                        key={project.id}
                        className="p-4 flex justify-between items-center"
                    >
                        <div>
                            <div className="font-medium">
                                {project.name}
                            </div>
                            {project.description && (
                                <div className="text-sm text-gray-500">
                                    {project.description}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => remove(project.id)}
                            className="text-red-600 hover:underline text-sm"
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>

        </div>
    );
}
