import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from '../lib/axios';

const ProjectContext = createContext();

export function ProjectProvider({ children }) {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    async function loadProjects() {
        try {
            const res = await axios.get('/api/projects');
            setProjects(res.data);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadProjects();
    }, []);

    return (
        <ProjectContext.Provider
            value={{
                projects,
                setProjects,
                reloadProjects: loadProjects,
                loading,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
}

export function useProjects() {
    return useContext(ProjectContext);
}
