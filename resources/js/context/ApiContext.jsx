import React, { createContext, useContext, useState } from 'react';
import axios from '../lib/axios';
import { useAuth } from './AuthContext';

const ApiContext = createContext(null);

export function ApiProvider({ children }) {
    const { user, loading: authLoading } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function api(config, options = {}) {
        const { silent = false, retry = true } = options;

        // wait until auth finishes booting
        if (authLoading) {
            await waitForAuth(authLoading);
        }

        try {
            if (!silent) setLoading(true);
            setError(null);

            const res = await axios(config);
            return res.data;

        } catch (err) {
            // 🔁 auto retry once after auth boot
            if (
                err.response?.status === 401 &&
                retry &&
                user
            ) {
                return api(config, { ...options, retry: false });
            }

            setError(err);
            throw err;

        } finally {
            if (!silent) setLoading(false);
        }
    }

    function waitForAuth() {
        return new Promise(resolve => {
            const interval = setInterval(() => {
                if (!authLoading) {
                    clearInterval(interval);
                    resolve();
                }
            }, 40);
        });
    }

    return (
        <ApiContext.Provider value={{
            api,
            apiLoading: loading,
            apiError: error,
        }}>
            {children}
        </ApiContext.Provider>
    );
}

export const useApi = () => useContext(ApiContext);
