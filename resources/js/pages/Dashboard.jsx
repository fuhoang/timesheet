import React, { useEffect, useState } from 'react';
import axios from '../lib/axios';
import Timer from '../components/Timer';
import ProjectSelect from '../components/ProjectSelect';

export default function Dashboard() {
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
        <div className="space-y-6">

            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow border">
                <h1 className="text-2xl font-semibold">
                    Today
                </h1>

                {timesheet ? (
                    <p className="mt-2 text-gray-600">
                        Total time:{' '}
                        <span className="font-medium text-gray-900">
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
            <div className="bg-white p-6 rounded-2xl shadow border">
                <h2 className="text-lg font-semibold mb-4">
                    Timer
                </h2>

            
                <ProjectSelect
                    projects={projects}
                    value={selectedProject}
                    onChange={(id) => setSelectedProject(Number(id))}
                />
    

                <div className="mt-4">
                    <Timer
                        projectId={selectedProject}
                        onChange={load}
                    />
                </div>
            </div>

            {/* Today’s Entries */}
            {timesheet?.entries?.length > 0 && (
                <div className="bg-white rounded-2xl shadow border divide-y">
                    <div className="p-4 font-semibold text-gray-700">
                        Today’s entries
                    </div>

                    {timesheet.entries.map(entry => (
                        <div
                            key={entry.id}
                            className="p-4 flex justify-between items-center"
                        >
                            <div>
                                <div className="font-medium text-gray-900">
                                    {entry.project?.name ?? 'No project'}
                                </div>

                                {entry.description && (
                                    <div className="text-sm text-gray-500">
                                        {entry.description}
                                    </div>
                                )}
                            </div>

                            <div className="text-right text-sm text-gray-600">
                                <div>
                                    {formatTime(entry.started_at)} –{' '}
                                    {entry.ended_at
                                        ? formatTime(entry.ended_at)
                                        : 'Running'}
                                </div>

                                <div className="font-medium text-gray-900">
                                    {entry.duration_minutes
                                        ? formatMinutes(entry.duration_minutes)
                                        : '—'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* -------------------------
   Helpers (production-safe)
-------------------------- */

function formatMinutes(minutes = 0) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
}

function formatTime(datetime) {
    return new Date(datetime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
}
