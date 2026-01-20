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

                {timesheet && (
                    <p className="mt-2 text-gray-600">
                        Total time:{' '}
                        <span className="font-medium text-gray-900">
                            {Math.floor(timesheet.total_minutes / 60)}h{' '}
                            {timesheet.total_minutes % 60}m
                        </span>
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
                    onChange={setSelectedProject}
                />
                <div className="mt-4">
                    <Timer projectId={selectedProject} onChange={load} />
                </div>
            </div>

        </div>
    );
}
