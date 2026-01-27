import React, {useEffect} from 'react';
import { useApi } from '../context/ApiContext';

export default function ProjectSelect({ projects = [], value, onChange }) {
    return (
        <select
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

