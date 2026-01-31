import React, { useState, useEffect } from 'react';

export default function ProjectForm({ api, reloadProjects, editingProject, setEditingProject, showToast }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (editingProject) {
            setName(editingProject.name);
            setDescription(editingProject.description || '');
            setErrors({});
        } else {
            setName('');
            setDescription('');
            setErrors({});
        }
    }, [editingProject]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!name.trim()) return;

        setSaving(true);
        setErrors({});

        try {
            if (editingProject) {
                await api({
                    method: 'patch',
                    url: `/api/projects/${editingProject.id}`,
                    data: { name, description },
                });
                showToast('Project updated successfully');
            } else {
                await api({
                    method: 'post',
                    url: '/api/projects',
                    data: { name, description },
                });
                showToast('Project created successfully');
            }

            setEditingProject(null);
            await reloadProjects();
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors || {});
            } else {
                showToast('Failed to save project', 'error');
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow border">
            <h2 className="font-semibold mb-4">{editingProject ? 'Edit Project' : 'Create Project'}</h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col">
                    <input
                        type="text"
                        placeholder="Project name"
                        className="border rounded-lg px-3 py-2 focus:outline-none focus:ring"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                    {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name[0]}</p>}
                </div>

                <div className="flex flex-col">
                    <input
                        type="text"
                        placeholder="Description (optional)"
                        className="border rounded-lg px-3 py-2 focus:outline-none focus:ring"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                    {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description[0]}</p>}
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-60"
                >
                    {saving ? 'Saving…' : editingProject ? 'Save Project' : 'Add Project'}
                </button>
            </form>
        </div>
    );
}
