import React, { useEffect, useMemo, useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import { useApi } from '../context/ApiContext';
import Timer from '../components/Timer';
import ProjectSelect from '../components/ProjectSelect';
import { DropdownSkeleton } from '../components/skeletons/DropdownSkeleton';
import { TimerSkeleton } from '../components/skeletons/TimerSkeleton';


export default function Dashboard() {
    const { projects, loading: projectsLoading, loadProjects } = useProjects();
    const { api } = useApi();
    const isDev = !!import.meta?.env?.DEV || window?.__APP_ENV__ === 'local';

    const [selectedProject, setSelectedProject] = useState(null);
    const [timesheet, setTimesheet] = useState(null);
    const [loadingTimesheet, setLoadingTimesheet] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [resumeProjectId, setResumeProjectId] = useState(null);
    const [timesheetError, setTimesheetError] = useState('');

    useEffect(() => {
        if (!selectedProject && projects.length > 0) {
            setSelectedProject(projects[0].id);
        }
    }, [projects]);

    useEffect(() => {
        loadTimesheet();
    }, [selectedProject]);

    const lastProject = useMemo(() => {
        if (!timesheet?.entries?.length) return null;
        const sorted = [...timesheet.entries].sort((a, b) => {
            const aTime = new Date(a.started_at).getTime();
            const bTime = new Date(b.started_at).getTime();
            return bTime - aTime;
        });
        return sorted[0]?.project || null;
    }, [timesheet]);

    async function loadTimesheet() {
        setLoadingTimesheet(true);
        setTimesheetError('');
        try {
            const data = await api({
                method: 'get',
                url: '/api/timesheets/today',
            });
            setTimesheet(data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Failed to load timesheet', err);
            setTimesheet(null);
            setTimesheetError('Unable to load today’s timesheet. Please try again.');
        } finally {
            setLoadingTimesheet(false);
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow border">
                <div className="flex items-center justify-between gap-3">
                    <h1 className="text-2xl font-semibold text-gray-900">Today</h1>
                    {isDev && (
                        <button
                            type="button"
                            onClick={() => setTimesheetError(prev => prev ? '' : 'Unable to load today’s timesheet. Please try again.')}
                            className="text-xs font-medium text-gray-500 hover:text-gray-700"
                        >
                            Toggle error (dev)
                        </button>
                    )}
                </div>
                {timesheetError && (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {timesheetError}
                    </div>
                )}
                {loadingTimesheet ? (
                    <p className="mt-2 text-gray-500 text-sm">Loading timesheet…</p>
                ) : (
                    <div className="mt-2 space-y-1">
                        <p className="text-gray-600">
                            Total time:{' '}
                            <span className="font-semibold text-gray-900">
                                {formatMinutes(timesheet?.total_minutes)}
                            </span>
                        </p>
                        {lastUpdated && (
                            <p className="text-xs text-gray-500">
                                Last updated: {formatUpdatedAt(lastUpdated)}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Timer */}
            <div className="bg-white p-6 rounded-2xl shadow border space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Timer</h2>

                {projectsLoading ? (
                    <DropdownSkeleton />
                ) : (
                    <ProjectSelect
                        projects={projects}
                        value={selectedProject}
                        onChange={(id) => setSelectedProject(Number(id))}
                    />
                )}

                {projectsLoading ? (
                    <TimerSkeleton />
                ) : (

                    <Timer
                        projectId={selectedProject}
                        disabled={timesheet?.submitted}
                        autoStartProjectId={resumeProjectId}
                        onAutoStartComplete={() => setResumeProjectId(null)}
                        onChange={loadTimesheet}
                    />
                )}

                {!projectsLoading && lastProject && !timesheet?.submitted && (
                    <button
                        type="button"
                        onClick={() => setResumeProjectId(lastProject.id)}
                        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                        Resume last project: <span className="font-semibold">{lastProject.name}</span>
                    </button>
                )}
            </div>

            {/* Entries */}
            {loadingTimesheet ? (
                <div className="bg-white rounded-2xl shadow border overflow-hidden">
                    <div className="px-6 py-4 border-b">
                        <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse" />
                    </div>
                    <div className="divide-y">
                        {[0, 1, 2].map((row) => (
                            <div key={row} className="px-6 py-4 flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="h-4 w-40 bg-gray-200 rounded-md animate-pulse" />
                                    <div className="h-3 w-56 bg-gray-200 rounded-md animate-pulse" />
                                    <div className="h-3 w-32 bg-gray-200 rounded-md animate-pulse" />
                                </div>
                                <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow border overflow-hidden">
                    <div className="px-6 py-4 font-semibold text-gray-900 border-b">Today’s entries</div>
                    {timesheet?.entries?.length > 0 ? (
                        <div className="divide-y">
                            {timesheet.entries.map(entry => {
                                const running = !entry.ended_at;
                                return (
                                    <div
                                        key={entry.id}
                                        className={`px-6 py-4 flex items-center justify-between ${
                                            running ? 'bg-green-50 dark:bg-white/70' : ''
                                        }`}
                                    >
                                        <div className="space-y-1">
                                            <div className="font-medium dashboard-entry-title">
                                                {entry.project?.name ?? 'No project'}
                                            </div>
                                            {entry.description && (
                                                <div className={`text-sm text-gray-500 ${running ? 'dark:text-gray-700' : 'dark:text-gray-400'}`}>
                                                    {entry.description}
                                                </div>
                                            )}
                                            <div className={`text-xs text-gray-400 ${running ? 'dark:text-gray-700' : 'dark:text-gray-500'}`}>
                                                {formatTime(entry.started_at)} – {entry.ended_at ? formatTime(entry.ended_at) : 'Now'}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            {entry.ended_at ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                                                    {formatMinutes(entry.duration_minutes)}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-200 dark:text-green-900 text-sm font-medium">
                                                    Running
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="px-6 py-8 text-center">
                            <div className="text-sm font-semibold text-gray-900">No entries yet</div>
                            <div className="mt-1 text-sm text-gray-500">
                                Start the timer above to log your first entry for today.
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* -------------------------
   Helpers
-------------------------- */
function formatMinutes(minutes = 0) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
}

function formatUpdatedAt(date) {
    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

function formatTime(datetime) {
    if (!datetime) return '';
    return new Date(datetime.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
