import React, { useEffect, useState } from 'react';

import axios from '../lib/axios';
import Timer from '../components/Timer';
import ProjectSelect from '../components/ProjectSelect';

import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';

export default function Dashboard() {
    
    const { user } = useAuth(); // get logged-in user info

    const { projects } = useProjects();
    // const [projects, setProjects] = useState([]);
    
    const [timesheet, setTimesheet] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [loading, setLoading] = useState(true);

    // Version counter to trigger reload when projects are updated
    const [projectVersion, setProjectVersion] = useState(0);

    // const isLocked = timesheet?.submitted;
    console.log(timesheet);
    useEffect(() => {
        load();
    }, [projectVersion]);

    // Auto-select first project if none selected
    useEffect(() => {
        if (projects.length > 0 && selectedProject === null) {
            setSelectedProject(projects[0].id);
        }
    }, [projects]);

    async function load() {
        setLoading(true);
        try {
            // Admin can see all projects
            const [timesheetRes] = await Promise.all([
                // axios.get('/api/projects'),
                axios.get('/api/timesheets/today'),
            ]);

            // setProjects(projectsRes.data);
            setTimesheet(timesheetRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    // Call this after creating/deleting a project in AdminProjects
    function refreshProjects() {
        setProjectVersion(v => v + 1);
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">

            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow border">
                <h1 className="text-2xl font-semibold text-gray-900">
                    Today
                </h1>

                {loading ? (
                    <p className="mt-2 text-gray-400 text-sm">Loading timesheet…</p>
                ) : timesheet ? (
                    <p className="mt-2 text-gray-600">
                        Total time:{' '}
                        <span className="font-semibold text-gray-900">
                            {formatMinutes(timesheet.total_minutes)}
                        </span>
                    </p>
                ) : (
                    <p className="mt-2 text-gray-400 text-sm">No timesheet yet</p>
                )}
            </div>

            {/* Timer */}
            <div className="bg-white p-6 rounded-2xl shadow border space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">
                    Timer
                </h2>

                <ProjectSelect
                    projects={projects}
                    value={selectedProject}
                    onChange={(id) => setSelectedProject(Number(id))}
                />

                {/* Only show Timer if a project is selected */}
                {selectedProject && (
                    <Timer
                        projectId={selectedProject}
                        // disabled={isLocked}
                        disabled={timesheet?.submitted}
                        onChange={load}
                    />
                )}
            </div>

            {/* Today’s Entries */}
            {timesheet?.entries?.length > 0 && (
                <div className="bg-white rounded-2xl shadow border overflow-hidden">
                    <div className="px-6 py-4 font-semibold text-gray-800 border-b">
                        Today’s entries
                    </div>

                    <div className="divide-y">
                        {timesheet.entries.map(entry => {
                            const running = !entry.ended_at;

                            return (
                                <div
                                    key={entry.id}
                                    className={`px-6 py-4 flex items-center justify-between ${
                                        running ? 'bg-green-50' : ''
                                    }`}
                                >
                                    {/* Left */}
                                    <div className="space-y-1">
                                        <div className="font-medium text-gray-900">
                                            {entry.project?.name ?? 'No project'}
                                        </div>

                                        {entry.description && (
                                            <div className="text-sm text-gray-500">
                                                {entry.description}
                                            </div>
                                        )}

                                        <div className="text-xs text-gray-400">
                                            {formatTime(entry.started_at)} –{' '}
                                            {entry.ended_at
                                                ? formatTime(entry.ended_at)
                                                : 'Now'}
                                        </div>
                                    </div>

                                    {/* Right */}
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
    return new Date(datetime.replace(' ', 'T')).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
}
