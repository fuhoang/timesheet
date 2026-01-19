import React from 'react';

export default function ProjectSelect({ projects }) {
    return (
        <select id="project">
            <option value="">Select project</option>

            {projects.map(project => (
                <option key={project.id} value={project.id}>
                    {project.name}
                </option>
            ))}
        </select>
    );
}
