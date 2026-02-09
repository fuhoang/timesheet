import React, { useEffect, useMemo, useState } from 'react';
import axios from '../../lib/axios';
import { useApi } from '../../context/ApiContext';

function formatDate(date) {
    return date.toISOString().slice(0, 10);
}

function getWeekRange(reference = new Date()) {
    const date = new Date(reference);
    const day = (date.getDay() + 6) % 7;
    const start = new Date(date);
    start.setDate(date.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
}

export default function Reports() {
    const { api, apiLoading } = useApi();
    const [{ start, end }] = useState(() => getWeekRange());
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [startDate, setStartDate] = useState(() => formatDate(start));
    const [endDate, setEndDate] = useState(() => formatDate(end));
    const [status, setStatus] = useState('');
    const [includeDrafts, setIncludeDrafts] = useState(false);
    const [projectId, setProjectId] = useState('');
    const [userId, setUserId] = useState('');
    const [sort, setSort] = useState('total_minutes');
    const [direction, setDirection] = useState('desc');
    const [page, setPage] = useState(1);
    const [perPage] = useState(10);
    const [presetName, setPresetName] = useState('');
    const [showDebug, setShowDebug] = useState(false);
    const [presets, setPresets] = useState(() => {
        try {
            const raw = window.localStorage.getItem('reportsPresets');
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    const users = report?.meta?.users ?? [];
    const projects = report?.meta?.projects ?? [];
    const totalRows = report?.meta?.total_rows ?? 0;
    const totalPages = report?.meta?.total_pages ?? 1;
    const overallMinutes = useMemo(() => {
        if (!report?.rows) return 0;
        return report.rows.reduce((sum, row) => sum + row.total_minutes, 0);
    }, [report]);

    useEffect(() => {
        let mounted = true;

        api({
            method: 'get',
            url: '/api/reports',
            params: {
                start: startDate,
                end: endDate,
                status: status || undefined,
                include_drafts: status ? undefined : includeDrafts,
                project_id: projectId || undefined,
                user_id: userId || undefined,
                sort,
                direction,
                page,
                per_page: perPage,
            },
        })
            .then(data => {
                if (mounted) {
                    setReport(data);
                }
            })
            .catch(err => {
                if (mounted) {
                    setError(err);
                }
            });

        return () => {
            mounted = false;
        };
    }, [api, startDate, endDate, status, includeDrafts, projectId, userId, sort, direction, page, perPage]);

    async function handleExport() {
        setExporting(true);
        try {
            const response = await axios.get('/api/reports', {
                params: {
                    start: startDate,
                    end: endDate,
                    format: 'csv',
                    status: status || undefined,
                    include_drafts: status ? undefined : includeDrafts,
                    project_id: projectId || undefined,
                    user_id: userId || undefined,
                    sort,
                    direction,
                },
                responseType: 'blob',
            });

            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `report-${startDate}-to-${endDate}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } finally {
            setExporting(false);
        }
    }

    function formatMinutes(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }

    function formatHours(minutes) {
        return `${(minutes / 60).toFixed(2)}h`;
    }

    function handlePageChange(nextPage) {
        if (nextPage < 1 || nextPage > totalPages) return;
        setPage(nextPage);
    }

    function savePreset() {
        const name = presetName.trim();
        if (!name) return;
        const next = presets.filter(preset => preset.name !== name).concat({
            name,
            startDate,
            endDate,
            status,
            includeDrafts,
            projectId,
            userId,
            sort,
            direction,
        });
        setPresets(next);
        setPresetName('');
        window.localStorage.setItem('reportsPresets', JSON.stringify(next));
    }

    function applyPreset(preset) {
        setStartDate(preset.startDate);
        setEndDate(preset.endDate);
        setStatus(preset.status);
        setIncludeDrafts(!!preset.includeDrafts);
        setProjectId(preset.projectId);
        setUserId(preset.userId);
        setSort(preset.sort);
        setDirection(preset.direction);
        setPage(1);
    }

    function deletePreset(name) {
        const next = presets.filter(preset => preset.name !== name);
        setPresets(next);
        window.localStorage.setItem('reportsPresets', JSON.stringify(next));
    }

    const showSkeleton = apiLoading && !report;

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
                    <p className="text-sm text-gray-500">
                        Summary ({startDate} to {endDate}) grouped by user.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowDebug(prev => !prev)}
                        className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                        {showDebug ? 'Hide debug' : 'Show debug'}
                    </button>
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={exporting}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60"
                    >
                        {exporting ? 'Exporting...' : 'Export CSV'}
                    </button>
                </div>
            </div>

            <div className="sticky top-4 z-10 bg-gray-50/80 backdrop-blur">
                <div className="bg-white border rounded-xl p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs uppercase text-gray-500">Start</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={event => {
                                setStartDate(event.target.value);
                                setPage(1);
                            }}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs uppercase text-gray-500">End</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={event => {
                                setEndDate(event.target.value);
                                setPage(1);
                            }}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs uppercase text-gray-500">Status</label>
                        <select
                            value={status}
                            onChange={event => {
                                setStatus(event.target.value);
                                setPage(1);
                            }}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        >
                            <option value="">All statuses</option>
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs uppercase text-gray-500">Project</label>
                        <select
                            value={projectId}
                            onChange={event => {
                                setProjectId(event.target.value);
                                setPage(1);
                            }}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        >
                            <option value="">All projects</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {users.length > 1 ? (
                        <div>
                            <label className="text-xs uppercase text-gray-500">User</label>
                            <select
                                value={userId}
                                onChange={event => {
                                    setUserId(event.target.value);
                                    setPage(1);
                                }}
                                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            >
                                <option value="">All users</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div />
                    )}
                    <div>
                        <label className="text-xs uppercase text-gray-500">Sort</label>
                        <select
                            value={sort}
                            onChange={event => setSort(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        >
                            <option value="total_minutes">Total minutes</option>
                            <option value="name">User name</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs uppercase text-gray-500">Direction</label>
                        <select
                            value={direction}
                            onChange={event => setDirection(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        >
                            <option value="desc">Descending</option>
                            <option value="asc">Ascending</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <div className="text-sm text-gray-600">
                            {totalRows} users total
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {['', 'submitted', 'approved', 'rejected', 'draft'].map(value => {
                        const label = value ? value : 'all';
                        const active = status === value;
                        return (
                            <button
                                key={`status-chip-${label}`}
                                type="button"
                                onClick={() => {
                                    setStatus(value);
                                    setPage(1);
                                }}
                                className={`px-3 py-1 rounded-full border text-xs uppercase ${
                                    active
                                        ? 'border-gray-900 bg-gray-900 text-white'
                                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={includeDrafts}
                            onChange={event => {
                                setIncludeDrafts(event.target.checked);
                                setPage(1);
                            }}
                        />
                        Include drafts
                    </label>
                    {!includeDrafts && !status && (
                        <span className="text-xs text-gray-400">
                            Defaulting to submitted and approved.
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="text-xs uppercase text-gray-500">Presets</div>
                    <select
                        value=""
                        onChange={event => {
                            const selectedName = event.target.value;
                            if (!selectedName) return;
                            const selected = presets.find(preset => preset.name === selectedName);
                            if (selected) {
                                applyPreset(selected);
                            }
                        }}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >
                        <option value="">Select preset</option>
                        {presets.map(preset => (
                            <option key={preset.name} value={preset.name}>
                                {preset.name}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        value={presetName}
                        onChange={event => setPresetName(event.target.value)}
                        placeholder="Preset name"
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                    <button
                        type="button"
                        onClick={savePreset}
                        className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
                    >
                        Save preset
                    </button>
                </div>
                {presets.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {presets.map(preset => (
                            <div
                                key={`preset-${preset.name}`}
                                className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-gray-600"
                            >
                                <span>{preset.name}</span>
                                <button
                                    type="button"
                                    onClick={() => deletePreset(preset.name)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                </div>
            </div>

            {apiLoading && (
                <div className="text-sm text-gray-500">Loading report...</div>
            )}

            {error && (
                <div className="text-sm text-red-600">
                    Unable to load reports. Please try again.
                </div>
            )}

            {showDebug && (
                <div className="bg-white border rounded-xl p-4 text-xs text-gray-600 whitespace-pre-wrap">
                    <div className="font-semibold text-gray-800 mb-2">Debug</div>
                    <div>error: {error ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : 'null'}</div>
                    <div className="mt-2">report: {report ? JSON.stringify(report) : 'null'}</div>
                </div>
            )}

            {!apiLoading && report?.rows?.length === 0 && (
                <div className="text-sm text-gray-500">
                    No entries found for this range.
                </div>
            )}

            {showSkeleton && (
                <div className="space-y-4">
                    {[1, 2, 3].map(item => (
                        <div key={item} className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-3 w-56 bg-gray-100 rounded animate-pulse" />
                                </div>
                                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {[1, 2, 3].map(inner => (
                                    <div key={inner} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {report?.rows?.length > 0 && (
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <div>
                        Showing page {report?.meta?.page ?? 1} of {totalPages}
                    </div>
                    <div>
                        Page total: <span className="font-semibold text-gray-900">{formatMinutes(overallMinutes)}</span>
                        <span className="text-gray-400"> ({formatHours(overallMinutes)})</span>
                    </div>
                </div>
            )}

            {report?.rows?.map(row => (
                <div
                    key={row.user?.id ?? row.user?.email ?? Math.random()}
                    className="bg-white border rounded-xl p-5 shadow-sm space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-lg font-semibold text-gray-900">
                                {row.user?.name ?? 'Unknown user'}
                            </div>
                            <div className="text-sm text-gray-500">
                                {row.user?.email ?? 'No email'}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs uppercase text-gray-400">Total</div>
                            <div className="text-lg font-semibold text-gray-900">
                                {formatMinutes(row.total_minutes)}
                                <span className="text-sm text-gray-400"> ({formatHours(row.total_minutes)})</span>
                            </div>
                        </div>
                    </div>

                    {row.projects?.length > 0 && (
                        <div>
                            <div className="text-xs uppercase text-gray-400 mb-2">Project totals</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {row.projects.map(project => (
                                    <div
                                        key={`${row.user?.id ?? 'user'}-project-${project.id ?? project.name}`}
                                        className="rounded-lg border border-gray-100 bg-white px-4 py-3 flex items-center justify-between"
                                    >
                                        <div className="text-sm font-medium text-gray-700">
                                            {project.name}
                                        </div>
                                        <div className="text-sm font-semibold text-gray-900">
                                            {formatMinutes(project.total_minutes)}
                                            <span className="text-xs text-gray-400"> ({formatHours(project.total_minutes)})</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {row.days.map(day => (
                            <div
                                key={`${row.user?.id ?? 'user'}-${day.date}`}
                                className={`rounded-lg border px-4 py-3 flex items-center justify-between ${
                                    day.status === 'rejected'
                                        ? 'border-red-200 bg-red-50'
                                        : day.status === 'draft'
                                            ? 'border-amber-200 bg-amber-50'
                                            : day.status === 'submitted'
                                                ? 'border-blue-200 bg-blue-50'
                                                : day.status === 'approved'
                                                    ? 'border-emerald-200 bg-emerald-50'
                                                    : 'border-gray-100 bg-gray-50'
                                }`}
                            >
                                <div className="text-sm font-medium text-gray-700">
                                    {day.date}
                                    {day.status && (
                                        <span className="ml-2 text-[11px] uppercase text-gray-400">
                                            {day.status}
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm font-semibold text-gray-900">
                                    {formatMinutes(day.total_minutes)}
                                </div>
                            </div>
                        ))}
                        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-700">Total</div>
                            <div className="text-sm font-semibold text-gray-900">
                                {formatMinutes(row.total_minutes)}
                                <span className="text-xs text-gray-400"> ({formatHours(row.total_minutes)})</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {report?.rows?.length > 0 && (
                <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center justify-between text-sm text-gray-600">
                    <div className="font-medium text-gray-900">Page total</div>
                    <div className="font-semibold text-gray-900">
                        {formatMinutes(overallMinutes)}
                        <span className="text-gray-400"> ({formatHours(overallMinutes)})</span>
                    </div>
                </div>
            )}

            {report?.rows?.length > 0 && (
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1}
                        className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <div className="text-sm text-gray-500">
                        Page {page} of {totalPages}
                    </div>
                    <button
                        type="button"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= totalPages}
                        className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
