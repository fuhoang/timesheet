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
    const [userQuery, setUserQuery] = useState('');
    const [projectQuery, setProjectQuery] = useState('');
    const [bulkUsers, setBulkUsers] = useState(new Set());
    const [bulkProjects, setBulkProjects] = useState(new Set());
    const [bulkSaving, setBulkSaving] = useState(false);

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

    function toggleBulkUser(userId) {
        setBulkUsers(prev => {
            const next = new Set(prev);
            if (next.has(userId)) {
                next.delete(userId);
            } else {
                next.add(userId);
            }
            return next;
        });
    }

    function toggleBulkProject(projectId) {
        setBulkProjects(prev => {
            const next = new Set(prev);
            if (next.has(projectId)) {
                next.delete(projectId);
            } else {
                next.add(projectId);
            }
            return next;
        });
    }

    function selectAllFilteredUsers(filteredUsers) {
        setBulkUsers(new Set(filteredUsers.map(user => user.id)));
    }

    async function applyBulkUpdate(mode) {
        if (!bulkUsers.size) return;
        setBulkSaving(true);
        try {
            const projectIds = Array.from(bulkProjects);
            const updates = Array.from(bulkUsers).map(async userId => {
                const current = Array.from(selected[userId] || []);
                let nextProjects = current;
                if (mode === 'add') {
                    nextProjects = Array.from(new Set([...current, ...projectIds]));
                } else if (mode === 'remove') {
                    nextProjects = current.filter(id => !projectIds.includes(id));
                } else if (mode === 'replace') {
                    nextProjects = projectIds;
                }
                const res = await api({
                    method: 'put',
                    url: `/api/admin/users/${userId}/projects`,
                    data: { project_ids: nextProjects },
                });
                return { userId, projects: res.projects };
            });

            const results = await Promise.all(updates);
            setUsers(prev => prev.map(user => {
                const found = results.find(result => result.userId === user.id);
                return found ? { ...user, projects: found.projects } : user;
            }));
            setSelected(prev => {
                const next = { ...prev };
                results.forEach(result => {
                    next[result.userId] = new Set(result.projects.map(p => p.id));
                });
                return next;
            });
        } finally {
            setBulkSaving(false);
        }
    }

    const projectCountLabel = useMemo(() => {
        if (!projects.length) return 'No projects';
        return `${projects.length} project${projects.length === 1 ? '' : 's'}`;
    }, [projects]);

    const filteredUsers = useMemo(() => {
        const query = userQuery.trim().toLowerCase();
        if (!query) return users;
        return users.filter(user => (
            user.name?.toLowerCase().includes(query)
            || user.email?.toLowerCase().includes(query)
        ));
    }, [users, userQuery]);

    const filteredProjects = useMemo(() => {
        const query = projectQuery.trim().toLowerCase();
        if (!query) return projects;
        return projects.filter(project => project.name?.toLowerCase().includes(query));
    }, [projects, projectQuery]);

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
                    <div className="bg-white rounded-2xl shadow border p-4 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <input
                                type="text"
                                value={userQuery}
                                onChange={event => setUserQuery(event.target.value)}
                                placeholder="Search users"
                                className="w-full md:w-64 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            />
                            <input
                                type="text"
                                value={projectQuery}
                                onChange={event => setProjectQuery(event.target.value)}
                                placeholder="Search projects"
                                className="w-full md:w-64 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            />
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => selectAllFilteredUsers(filteredUsers)}
                                disabled={!filteredUsers.length}
                            >
                                Select filtered users
                            </Button>
                            <div className="text-xs text-gray-500">
                                Selected: {bulkUsers.size} users
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {filteredProjects.map(project => (
                                <label
                                    key={`bulk-project-${project.id}`}
                                    className="flex items-center gap-2 text-sm text-gray-700"
                                >
                                    <input
                                        type="checkbox"
                                        checked={bulkProjects.has(project.id)}
                                        onChange={() => toggleBulkProject(project.id)}
                                    />
                                    {project.name}
                                </label>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="primary"
                                size="sm"
                                disabled={bulkSaving || !bulkUsers.size}
                                onClick={() => applyBulkUpdate('add')}
                            >
                                {bulkSaving ? 'Applying…' : 'Add selected projects'}
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={bulkSaving || !bulkUsers.size}
                                onClick={() => applyBulkUpdate('remove')}
                            >
                                Remove selected projects
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={bulkSaving || !bulkUsers.size}
                                onClick={() => applyBulkUpdate('replace')}
                            >
                                Replace with selected projects
                            </Button>
                        </div>
                    </div>

                    {filteredUsers.map(user => (
                        <div key={user.id} className="bg-white rounded-2xl shadow border p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-semibold text-gray-900">{user.name}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                                <label className="flex items-center gap-2 text-sm text-gray-500">
                                    <input
                                        type="checkbox"
                                        checked={bulkUsers.has(user.id)}
                                        onChange={() => toggleBulkUser(user.id)}
                                    />
                                    Select
                                </label>
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
                                {filteredProjects.map(project => {
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
