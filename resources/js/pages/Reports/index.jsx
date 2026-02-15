import React, { useEffect, useMemo, useState } from 'react';
import axios from '../../lib/axios';
import { useApi } from '../../context/ApiContext';
import ReportsFilters from './ReportsFilters';
import ReportsRow from './ReportsRow';
import ReportsPagination from './ReportsPagination';

const REPORT_LAST_REFRESH_KEY = 'reportsLastRefreshAt';
const REPORT_LAST_FILTERS_KEY = 'reportsLastFilters';

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
    const [initialFilters] = useState(() => {
        const { start: defaultStart, end: defaultEnd } = getWeekRange();
        const fallback = {
            startDate: formatDate(defaultStart),
            endDate: formatDate(defaultEnd),
            status: '',
            includeDrafts: false,
            projectId: '',
            userId: '',
            sort: 'total_minutes',
            direction: 'desc',
            page: 1,
            perPage: 10,
        };

        try {
            const raw = window.localStorage.getItem(REPORT_LAST_FILTERS_KEY);
            if (!raw) return fallback;
            return { ...fallback, ...JSON.parse(raw) };
        } catch {
            return fallback;
        }
    });
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [startDate, setStartDate] = useState(initialFilters.startDate || formatDate(start));
    const [endDate, setEndDate] = useState(initialFilters.endDate || formatDate(end));
    const [status, setStatus] = useState(initialFilters.status || '');
    const [includeDrafts, setIncludeDrafts] = useState(!!initialFilters.includeDrafts);
    const [projectId, setProjectId] = useState(initialFilters.projectId || '');
    const [userId, setUserId] = useState(initialFilters.userId || '');
    const [sort, setSort] = useState(initialFilters.sort || 'total_minutes');
    const [direction, setDirection] = useState(initialFilters.direction || 'desc');
    const [page, setPage] = useState(Number(initialFilters.page || 1));
    const [perPage, setPerPage] = useState(Number(initialFilters.perPage || 10));
    const [presetName, setPresetName] = useState('');
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
    const totalPages = Math.max(report?.meta?.total_pages ?? 1, 1);
    const overallMinutes = useMemo(() => {
        if (!report?.rows) return 0;
        return report.rows.reduce((sum, row) => sum + row.total_minutes, 0);
    }, [report]);
    const totalMinutesAll = report?.meta?.total_minutes_all ?? overallMinutes;

    const queryParams = useMemo(() => ({
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
    }), [startDate, endDate, status, includeDrafts, projectId, userId, sort, direction, page, perPage]);

    useEffect(() => {
        window.localStorage.setItem(REPORT_LAST_FILTERS_KEY, JSON.stringify({
            startDate,
            endDate,
            status,
            includeDrafts,
            projectId,
            userId,
            sort,
            direction,
            page,
            perPage,
        }));
    }, [startDate, endDate, status, includeDrafts, projectId, userId, sort, direction, page, perPage]);

    useEffect(() => {
        let mounted = true;
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            api({
                method: 'get',
                url: '/api/reports',
                params: queryParams,
                signal: controller.signal,
            })
                .then(data => {
                    if (mounted) {
                        setReport(data);
                        setError(null);
                        window.localStorage.setItem(REPORT_LAST_REFRESH_KEY, new Date().toISOString());
                    }
                })
                .catch(err => {
                    if (mounted && err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
                        setError(err);
                    }
                });
        }, 180);

        return () => {
            mounted = false;
            controller.abort();
            window.clearTimeout(timer);
        };
    }, [api, queryParams]);

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

    function resetFilters() {
        const { start: weekStart, end: weekEnd } = getWeekRange();
        setStartDate(formatDate(weekStart));
        setEndDate(formatDate(weekEnd));
        setStatus('');
        setIncludeDrafts(false);
        setProjectId('');
        setUserId('');
        setSort('total_minutes');
        setDirection('desc');
        setPage(1);
        setPerPage(10);
    }

    function applyDatePreset(type) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let nextStart = today;
        let nextEnd = today;

        if (type === 'this_week') {
            const range = getWeekRange(today);
            nextStart = range.start;
            nextEnd = range.end;
        } else if (type === 'last_week') {
            const reference = new Date(today);
            reference.setDate(reference.getDate() - 7);
            const range = getWeekRange(reference);
            nextStart = range.start;
            nextEnd = range.end;
        } else if (type === 'last_30_days') {
            nextEnd = today;
            nextStart = new Date(today);
            nextStart.setDate(nextStart.getDate() - 29);
        }

        setStartDate(formatDate(nextStart));
        setEndDate(formatDate(nextEnd));
        setPage(1);
    }

    const showSkeleton = apiLoading && !report;

    return (
        <div className="space-y-6 reports-page">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Reports</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                        Summary ({startDate} to {endDate}) grouped by user.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleExport}
                    disabled={exporting}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-60"
                >
                    {exporting ? 'Exporting...' : 'Export CSV'}
                </button>
            </div>

            <ReportsFilters
                startDate={startDate}
                endDate={endDate}
                status={status}
                includeDrafts={includeDrafts}
                projectId={projectId}
                userId={userId}
                sort={sort}
                direction={direction}
                perPage={perPage}
                projects={projects}
                users={users}
                totalRows={totalRows}
                presetName={presetName}
                presets={presets}
                onStartDateChange={value => {
                    setStartDate(value);
                    setPage(1);
                }}
                onEndDateChange={value => {
                    setEndDate(value);
                    setPage(1);
                }}
                onStatusChange={value => {
                    setStatus(value);
                    setPage(1);
                }}
                onIncludeDraftsChange={checked => {
                    setIncludeDrafts(checked);
                    setPage(1);
                }}
                onProjectChange={value => {
                    setProjectId(value);
                    setPage(1);
                }}
                onUserChange={value => {
                    setUserId(value);
                    setPage(1);
                }}
                onSortChange={setSort}
                onDirectionChange={setDirection}
                onPerPageChange={value => {
                    setPerPage(value);
                    setPage(1);
                }}
                onPresetNameChange={setPresetName}
                onPresetSelect={name => {
                    if (!name) return;
                    const selected = presets.find(preset => preset.name === name);
                    if (selected) {
                        applyPreset(selected);
                    }
                }}
                onPresetSave={savePreset}
                onPresetRemove={deletePreset}
                onApplyDatePreset={applyDatePreset}
                onResetFilters={resetFilters}
            />

            {apiLoading && (
                <div className="text-sm text-gray-500 dark:text-gray-300">Loading report...</div>
            )}

            {error && (
                <div className="text-sm text-red-600 dark:text-red-300">
                    Unable to load reports. Please try again.
                </div>
            )}

            {!apiLoading && report?.rows?.length === 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-300">
                    {status || includeDrafts
                        ? 'No entries found for this range. Try widening the dates.'
                        : 'No submitted, approved, or rejected entries in this range. Toggle "Include drafts" or widen the dates.'}
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
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-300">
                    <div>
                        Showing page {report?.meta?.page ?? 1} of {totalPages}
                    </div>
                    <div className="text-right">
                        <div>
                            Page total: <span className="font-semibold text-gray-900 dark:text-gray-100">{formatMinutes(overallMinutes)}</span>
                            <span className="text-gray-400 dark:text-gray-500"> ({formatHours(overallMinutes)})</span>
                        </div>
                        <div>
                            All pages: <span className="font-semibold text-gray-900 dark:text-gray-100">{formatMinutes(totalMinutesAll)}</span>
                            <span className="text-gray-400 dark:text-gray-500"> ({formatHours(totalMinutesAll)})</span>
                        </div>
                    </div>
                </div>
            )}

            {report?.rows?.map(row => (
                <ReportsRow
                    key={row.user?.id ?? row.user?.email}
                    row={row}
                    formatMinutes={formatMinutes}
                    formatHours={formatHours}
                />
            ))}

            {report?.rows?.length > 0 && (
                <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                    <div className="font-medium text-gray-900 dark:text-gray-100">Page total</div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatMinutes(overallMinutes)}
                        <span className="text-gray-400 dark:text-gray-500"> ({formatHours(overallMinutes)})</span>
                    </div>
                </div>
            )}

            <ReportsPagination
                page={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
        </div>
    );
}
