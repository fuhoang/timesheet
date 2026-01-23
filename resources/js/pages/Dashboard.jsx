import React, { useEffect, useState } from 'react';
import axios from '../lib/axios';
import Timer from '../components/Timer';
import ProjectSelect from '../components/ProjectSelect';

import { useAuth } from '../context/AuthContext';


export default function Dashboard() {

    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [timesheet, setTimesheet] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        try {
            const [projectsRes, timesheetRes] = await Promise.all([
                axios.get('/api/projects'),
                axios.get('/api/timesheets/today'),
            ]);

            setProjects(projectsRes.data);
            setTimesheet(timesheetRes.data);
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">


            <div className="bg-yellow-50 border p-3 rounded text-sm mb-4">
                Logged in as: <strong>{user?.email}</strong><br />
                Role: <strong>{user?.is_admin ? 'Admin' : 'User'}</strong>
            </div>

            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow border">
                <h1 className="text-2xl font-semibold text-gray-900">
                    Today
                </h1>

                {timesheet ? (
                    <p className="mt-2 text-gray-600">
                        Total time:{' '}
                        <span className="font-semibold text-gray-900">
                            {formatMinutes(timesheet.total_minutes)}
                        </span>
                    </p>
                ) : (
                    <p className="mt-2 text-gray-400 text-sm">
                        Loading timesheet…
                    </p>
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

                <Timer
                    projectId={selectedProject}
                    onChange={load}
                />
            </div>

            {/* Entries */}
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
                                        {entry.duration_minutes ? (
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
