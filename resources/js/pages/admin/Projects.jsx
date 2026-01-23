import React, { useEffect, useState } from 'react';
import axios from '../../lib/axios';

export default function AdminProjects() {
    const [projects, setProjects] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        load();
    }, []);

    async function load() {
        const res = await axios.get('/api/admin/projects');
        setProjects(res.data);
    }

    async function create(e) {
        e.preventDefault();

        await axios.post('/api/admin/projects', {
            name,
            description,
        });

        setName('');
        setDescription('');
        load();
    }

    async function remove(id) {
        if (!confirm('Delete project?')) return;

        await axios.delete(`/api/admin/projects/${id}`);
        load();
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            <h1 className="text-2xl font-semibold">Projects</h1>

            {/* Create */}
            <form
                onSubmit={create}
                className="bg-white p-6 rounded-2xl shadow border space-y-4"
            >
                <input
                    className="w-full border p-3 rounded-xl"
                    placeholder="Project name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                />

                <textarea
                    className="w-full border p-3 rounded-xl"
                    placeholder="Description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />

                <button className="bg-blue-600 text-white px-6 py-2 rounded-xl">
                    Add project
                </button>
            </form>

            {/* List */}
            <div className="bg-white rounded-2xl shadow border divide-y">
                {projects.map(project => (
                    <div
                        key={project.id}
                        className="p-4 flex justify-between items-center"
                    >
                        <div>
                            <div className="font-medium">{project.name}</div>
                            <div className="text-sm text-gray-500">
                                {project.description}
                            </div>
                        </div>

                        <button
                            onClick={() => remove(project.id)}
                            className="text-red-600 hover:underline"
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
