import React, { useEffect, useState } from 'react';
import axios from '../lib/axios';
import Timer from '../components/Timer';
import ProjectSelect from '../components/ProjectSelect';

export default function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [timesheet, setTimesheet] = useState(null);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        const [projectsRes, timesheetRes] = await Promise.all([
            axios.get('/api/projects'),
            axios.get('/api/timesheets/today'),
        ]);

        setProjects(projectsRes.data);
        setTimesheet(timesheetRes.data);
    }

    return (
        <div>
            <h1>Dashboard</h1>

            {timesheet && (
                <p>
                    Today total: {Math.floor(timesheet.total_minutes / 60)}h{' '}
                    {timesheet.total_minutes % 60}m
                </p>
            )}

            <ProjectSelect projects={projects} />

            <Timer onChange={load} />
        </div>
    );
}
