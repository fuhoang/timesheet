import React, { useEffect, useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import { useApi } from '../context/ApiContext';
import Timer from '../components/Timer';
import ProjectSelect from '../components/ProjectSelect';
import { DropdownSkeleton } from '../components/skeletons/DropdownSkeleton';
import { TimerSkeleton } from '../components/skeletons/TimerSkeleton';


export default function Dashboard() {
    const { projects, loading: projectsLoading, loadProjects } = useProjects();
    const { api } = useApi();

    const [selectedProject, setSelectedProject] = useState(null);
    const [timesheet, setTimesheet] = useState(null);
    const [loadingTimesheet, setLoadingTimesheet] = useState(true);

    useEffect(() => {
        if (!selectedProject && projects.length > 0) {
            setSelectedProject(projects[0].id);
        }
    }, [projects]);

    useEffect(() => {
        loadTimesheet();
    }, [selectedProject]);

    async function loadTimesheet() {
        setLoadingTimesheet(true);
        try {
            const data = await api({
                method: 'get',
                url: '/api/timesheets/today',
            });
            setTimesheet(data);
        } catch (err) {
            console.error('Failed to load timesheet', err);
            setTimesheet(null);
        } finally {
            setLoadingTimesheet(false);
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow border">
                <h1 className="text-2xl font-semibold text-gray-900">Today</h1>
                {loadingTimesheet ? (
                    <p className="mt-2 text-gray-400 text-sm">Loading timesheet…</p>
                ) : (
                    <p className="mt-2 text-gray-600">
                        Total time:{' '}
                        <span className="font-semibold text-gray-900">
                            {formatMinutes(timesheet?.total_minutes)}
                        </span>
                    </p>
                )}
            </div>

            {/* Timer */}
            <div className="bg-white p-6 rounded-2xl shadow border space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">Timer</h2>

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
                        onChange={loadTimesheet}
                    />
                )}
            </div>

            {/* Entries */}
            {timesheet?.entries?.length > 0 && (
                <div className="bg-white rounded-2xl shadow border overflow-hidden">
                    <div className="px-6 py-4 font-semibold text-gray-800 border-b">Today’s entries</div>
                    <div className="divide-y">
                        {timesheet.entries.map(entry => {
                            const running = !entry.ended_at;
                            return (
                                <div
                                    key={entry.id}
                                    className="px-6 py-4 flex items-center justify-between"
                                >
                                    <div className="space-y-1">
                                        <div className={`font-medium text-gray-900 ${running ? 'dark:text-black' : 'dark:text-gray-100'}`}>{entry.project?.name ?? 'No project'}</div>
                                        {entry.description && (
                                            <div className={`text-sm text-gray-500 ${running ? 'dark:text-gray-700' : 'dark:text-gray-400'}`}>{entry.description}</div>
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
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                                                Running
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
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

function formatTime(datetime) {
    if (!datetime) return '';
    return new Date(datetime.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
