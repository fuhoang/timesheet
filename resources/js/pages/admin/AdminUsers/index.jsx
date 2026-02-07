import React, { useEffect, useMemo, useState } from 'react';
import { useApi } from '../../../context/ApiContext';
import Button from '../../../components/ui/Button';
import InlineAlert from '../../../components/ui/InlineAlert';

export default function AdminUsers() {
    const { api } = useApi();
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingUserId, setSavingUserId] = useState(null);
    const [selected, setSelected] = useState({});

    useEffect(() => {
        loadUsers();
    }, []);

    async function loadUsers() {
        setLoading(true);
        setError('');
        try {
            const res = await api({ method: 'get', url: '/api/admin/users' });
            setUsers(res.users || []);
            setProjects(res.projects || []);
            const initial = {};
            (res.users || []).forEach(user => {
                initial[user.id] = new Set((user.projects || []).map(p => p.id));
            });
            setSelected(initial);
        } catch (err) {
            setError('Unable to load users');
        } finally {
            setLoading(false);
        }
    }

    function toggleProject(userId, projectId) {
        setSelected(prev => {
            const next = { ...prev };
            const current = new Set(next[userId] || []);
            if (current.has(projectId)) {
                current.delete(projectId);
            } else {
                current.add(projectId);
            }
            next[userId] = current;
            return next;
        });
    }

    async function saveUserProjects(userId) {
        setSavingUserId(userId);
        try {
            const projectIds = Array.from(selected[userId] || []);
            const res = await api({
                method: 'put',
                url: `/api/admin/users/${userId}/projects`,
                data: { project_ids: projectIds },
            });
            setUsers(prev => prev.map(user => (
                user.id === userId ? { ...user, projects: res.projects } : user
            )));
        } finally {
            setSavingUserId(null);
        }
    }

    const projectCountLabel = useMemo(() => {
        if (!projects.length) return 'No projects';
        return `${projects.length} project${projects.length === 1 ? '' : 's'}`;
    }, [projects]);

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow border">
                <h1 className="text-2xl font-semibold">Admin · Users</h1>
                <p className="text-gray-600 mt-1">
                    Assign projects to users ({projectCountLabel})
                </p>
            </div>

            {error && <InlineAlert>{error}</InlineAlert>}

            {loading ? (
                <div className="p-6 text-gray-500">Loading users…</div>
            ) : (
                <div className="space-y-4">
                    {users.map(user => (
                        <div key={user.id} className="bg-white rounded-2xl shadow border p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-semibold text-gray-900">{user.name}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => saveUserProjects(user.id)}
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
                                                onChange={() => toggleProject(user.id, project.id)}
                                            />
                                            {project.name}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
