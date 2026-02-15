import React, { useEffect, useMemo, useState } from 'react';
import { useApi } from '../../../context/ApiContext';
import InlineAlert from '../../../components/ui/InlineAlert';
import { getApiErrorDetails } from '../../../utils/apiError';
import AdminUsersAuditLog from './AdminUsersAuditLog';
import AdminUsersBulkProjects from './AdminUsersBulkProjects';
import AdminUsersFilters from './AdminUsersFilters';
import AdminUsersList from './AdminUsersList';
import AdminUsersPagination from './AdminUsersPagination';

export default function AdminUsers() {
    const { api } = useApi();
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
    const [assignedOnly, setAssignedOnly] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        loadUsers(1);
    }, [userQuery, roleFilter, perPage]);

    async function loadUsers(page = 1) {
        setLoading(true);
        setError(null);
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
            setError(getApiErrorDetails(err, 'Unable to load users'));
        } finally {
            setLoading(false);
        }
    }

    async function exportLogs() {
        const res = await api({
            method: 'get',
            url: '/api/admin/users',
            params: { logs_format: 'csv' },
            responseType: 'blob',
        });

        const blob = new Blob([res], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'assignment-logs.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
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

    function selectAllBulkProjects() {
        setBulkProjects(new Set(filteredProjects.map(project => project.id)));
    }

    function clearAllBulkProjects() {
        setBulkProjects(new Set());
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

    const projectNameMap = useMemo(() => {
        const map = new Map();
        projects.forEach(project => map.set(project.id, project.name));
        return map;
    }, [projects]);

    function formatProjectList(ids) {
        if (!ids || ids.length === 0) return 'None';
        return ids.map(id => projectNameMap.get(id) || `#${id}`).join(', ');
    }

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

    function selectAllProjectsForUser(userId) {
        setSelected(prev => ({
            ...prev,
            [userId]: new Set(filteredProjects.map(project => project.id)),
        }));
    }

    function clearProjectsForUser(userId) {
        setSelected(prev => ({
            ...prev,
            [userId]: new Set(),
        }));
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow border">
                <h1 className="text-2xl font-semibold">Admin · Users</h1>
                <p className="text-gray-600 mt-1">
                    Assign projects to users ({projectCountLabel})
                </p>
            </div>

            {error && <InlineAlert requestId={error.requestId}>{error.message}</InlineAlert>}

            {loading ? (
                <div className="p-6 text-gray-500">Loading users…</div>
            ) : (
                <div className="space-y-4">
                    {filteredUsers.length === 0 && (
                        <div className="bg-white rounded-2xl shadow border p-6 text-sm text-gray-500">
                            No users match your filters. Try clearing the search or role filter.
                        </div>
                    )}
                    <AdminUsersAuditLog
                        logs={assignmentLogs}
                        formatProjectList={formatProjectList}
                        onExport={exportLogs}
                    />

                    <AdminUsersFilters
                        userQuery={userQuery}
                        roleFilter={roleFilter}
                        projectQuery={projectQuery}
                        assignedOnly={assignedOnly}
                        perPage={perPage}
                        onUserQueryChange={setUserQuery}
                        onRoleFilterChange={setRoleFilter}
                        onProjectQueryChange={setProjectQuery}
                        onAssignedOnlyChange={setAssignedOnly}
                        onPerPageChange={value => setPerPage(value)}
                        onSelectFilteredUsers={() => selectAllFilteredUsers(filteredUsers)}
                        selectedCount={bulkUsers.size}
                        paginationSummary={`Showing ${pagination.from}-${pagination.to} of ${pagination.total}`}
                    />

                    <AdminUsersBulkProjects
                        projects={filteredProjects}
                        bulkProjects={bulkProjects}
                        onToggleProject={toggleBulkProject}
                        onSelectAllProjects={selectAllBulkProjects}
                        onClearAllProjects={clearAllBulkProjects}
                        bulkSaving={bulkSaving}
                        bulkUsersCount={bulkUsers.size}
                        onAdd={() => applyBulkUpdate('add')}
                        onRemove={() => applyBulkUpdate('remove')}
                        onReplace={() => applyBulkUpdate('replace')}
                    />

                    <AdminUsersList
                        users={filteredUsers}
                        projects={filteredProjects}
                        selected={selected}
                        assignedOnly={assignedOnly}
                        bulkUsers={bulkUsers}
                        savingUserId={savingUserId}
                        onToggleBulkUser={toggleBulkUser}
                        onSaveUser={saveUserProjects}
                        onToggleProject={toggleProject}
                        onSelectAllProjectsForUser={selectAllProjectsForUser}
                        onClearProjectsForUser={clearProjectsForUser}
                    />

                    <AdminUsersPagination
                        pagination={pagination}
                        onPageChange={goToPage}
                    />
                </div>
            )}
        </div>
    );
}
