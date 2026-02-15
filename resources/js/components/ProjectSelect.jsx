import React from 'react';

export default function ProjectSelect({ projects = [], value, onChange }) {
    return (
        <select
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
        >
            <option value="">Select a project</option>
            {projects.map(p => (
                <option key={p.id} value={p.id}>
                    {p.name}
                </option>
            ))}
        </select>
    );
}
