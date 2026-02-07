import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUser = async () => {
        try {
            const data = await authApi.getUser();
            setUser(data);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const register = async (data) => {
        await authApi.register(data);
        await loadUser();
    };

    const login = async (credentials) => {
        await authApi.login(credentials);
        await loadUser();

        if (typeof window !== 'undefined' && window.projectReload) {
            window.projectReload();
        }
    };


    const logout = async () => {
        await authApi.logout();
        setUser(null);
    };

    useEffect(() => {
        loadUser();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, register, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
