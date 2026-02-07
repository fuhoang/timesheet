import React, { createContext, useContext, useEffect, useState } from 'react';
import { useApi } from './ApiContext';
import { useAuth } from './AuthContext';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
    const { api } = useApi();
    const { user, loading: authLoading } = useAuth();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading || !user) return;
        loadProjects();
    }, [authLoading, user]);

    useEffect(() => {
        window.projectReload = loadProjects;

        return () => {
            window.projectReload = null;
        };
    }, []);

    async function loadProjects() {
        setLoading(true);
        try {
            const url = user?.is_admin ? '/api/admin/projects' : '/api/projects';
            const data = await api({ method: 'get', url });
            setProjects(data ?? []);
        } catch (err) {
            console.error('Failed to load projects', err);
            setProjects([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (user) {
            loadProjects();
        } else {
            setProjects([]);
        }
    }, [user]);

    return (
        <ProjectContext.Provider value={{ 
            projects,
            loading,
            reloadProjects: loadProjects,
        }}>
            {children}
        </ProjectContext.Provider>
    );
}

export const useProjects = () => {
    const context = useContext(ProjectContext);
    if (!context) throw new Error('useProjects must be used inside ProjectProvider');
    return context;
};
