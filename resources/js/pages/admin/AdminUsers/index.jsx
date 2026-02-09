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
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        from: 0,
        to: 0,
        total: 0,
    });
    const [userQuery, setUserQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [projectQuery, setProjectQuery] = useState('');
    const [bulkUsers, setBulkUsers] = useState(new Set());
    const [bulkProjects, setBulkProjects] = useState(new Set());
    const [bulkSaving, setBulkSaving] = useState(false);
    const [assignmentLogs, setAssignmentLogs] = useState([]);
    const [perPage, setPerPage] = useState(10);

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        loadUsers(1);
    }, [userQuery, roleFilter, perPage]);

    async function loadUsers(page = 1) {
        setLoading(true);
        setError('');
        try {
            const res = await api({
                method: 'get',
                url: '/api/admin/users',
                params: {
                    page,
                    per_page: perPage,
                    q: userQuery || undefined,
                    role: roleFilter || undefined,
                    include_logs: true,
                },
            });
            setUsers(res.users?.data || []);
            setProjects(res.projects || []);
            setAssignmentLogs(res.assignment_logs || []);
            setPagination({
                current_page: res.users?.current_page ?? 1,
                last_page: res.users?.last_page ?? 1,
                from: res.users?.from ?? 0,
                to: res.users?.to ?? 0,
                total: res.users?.total ?? res.users?.data?.length ?? 0,
            });
            const initial = {};
            (res.users?.data || []).forEach(user => {
                initial[user.id] = new Set((user.projects || []).map(p => p.id));
            });
            setSelected(initial);
            setBulkUsers(new Set());
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

    function goToPage(page) {
        if (page < 1 || page > pagination.last_page) return;
        loadUsers(page);
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
                    {assignmentLogs.length > 0 && (
                        <div className="bg-white rounded-2xl shadow border p-4 space-y-3">
                            <div className="text-sm font-semibold text-gray-900">Recent assignment changes</div>
                            <div className="space-y-2 text-sm text-gray-600">
                                {assignmentLogs.map(log => (
                                    <div key={log.id} className="flex flex-wrap items-center gap-2">
                                        <span className="font-medium text-gray-800">
                                            {log.admin?.name ?? 'Admin'}
                                        </span>
                                        <span>updated</span>
                                        <span className="font-medium text-gray-800">
                                            {log.user?.name ?? 'User'}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(log.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="bg-white rounded-2xl shadow border p-4 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <input
                                type="text"
                                value={userQuery}
                                onChange={event => setUserQuery(event.target.value)}
                                placeholder="Search users"
                                className="w-full md:w-64 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            />
                            <select
                                value={roleFilter}
                                onChange={event => setRoleFilter(event.target.value)}
                                className="w-full md:w-48 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            >
                                <option value="">All roles</option>
                                <option value="admin">Admin</option>
                                <option value="user">User</option>
                            </select>
                            <select
                                value={perPage}
                                onChange={event => setPerPage(Number(event.target.value))}
                                className="w-full md:w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            >
                                <option value={10}>10 / page</option>
                                <option value={20}>20 / page</option>
                                <option value={50}>50 / page</option>
                            </select>
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
                                <span className="ml-3 text-xs text-gray-400">
                                    Showing {pagination.from}-{pagination.to} of {pagination.total}
                                </span>
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

                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Page {pagination.current_page} of {pagination.last_page}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => goToPage(pagination.current_page - 1)}
                                disabled={pagination.current_page <= 1}
                            >
                                Previous
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => goToPage(pagination.current_page + 1)}
                                disabled={pagination.current_page >= pagination.last_page}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
