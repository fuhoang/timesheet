import React, { createContext, useContext, useEffect, useState } from 'react';
import { useApi } from './ApiContext';
import { useAuth } from './AuthContext';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
    const { api } = useApi();
    const { user, loading: authLoading } = useAuth();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    /* -----------------------------
       Load after auth boots
    ----------------------------- */
    useEffect(() => {
        if (authLoading || !user) return;
        loadProjects();
    }, [authLoading, user]);

    /* -----------------------------
       GLOBAL reload hook
       used after login / admin create
    ----------------------------- */
    useEffect(() => {
        window.projectReload = loadProjects;

        return () => {
            window.projectReload = null;
        };
    }, []);

    async function loadProjects() {
        setLoading(true);
        try {
            const data = await api({ method: 'get', url: '/api/projects' });
            setProjects(data ?? []);
        } catch (err) {
            console.error('Failed to load projects', err);
            setProjects([]);
        } finally {
            setLoading(false);
        }
    }

    // load once after login
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
