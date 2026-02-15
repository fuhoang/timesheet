import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from '../lib/axios';
import { useAuth } from './AuthContext';

const ApiContext = createContext(null);

export function ApiProvider({ children }) {
    const { user, loading: authLoading } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastSuccessAt, setLastSuccessAt] = useState(null);
    const [lastRequestId, setLastRequestId] = useState(null);
    const [lastErrorRequestId, setLastErrorRequestId] = useState(null);
    const authLoadingRef = useRef(authLoading);

    useEffect(() => {
        authLoadingRef.current = authLoading;
    }, [authLoading]);

    const waitForAuth = useCallback(() => new Promise(resolve => {
        const interval = setInterval(() => {
            if (!authLoadingRef.current) {
                clearInterval(interval);
                resolve();
            }
        }, 40);
    }), []);

    const api = useCallback(async (config, options = {}) => {
        const { silent = false, retry = true } = options;

        if (authLoadingRef.current) {
            await waitForAuth();
        }

        try {
            if (!silent) setLoading(true);
            setError(null);

            const res = await axios(config);
            setLastSuccessAt(new Date().toISOString());
            setLastRequestId(res?.headers?.['x-request-id'] || res?.data?.request_id || null);
            setLastErrorRequestId(null);
            return res.data;

        } catch (err) {
            if (
                err.response?.status === 401 &&
                retry &&
                user
            ) {
                return api(config, { ...options, retry: false });
            }

            setError(err);
            const errorRequestId = err?.response?.headers?.['x-request-id'] || err?.response?.data?.request_id || null;
            setLastErrorRequestId(errorRequestId);
            throw err;

        } finally {
            if (!silent) setLoading(false);
        }
    }, [user, waitForAuth]);

    const value = useMemo(() => ({
        api,
        apiLoading: loading,
        apiError: error,
        apiLastSuccessAt: lastSuccessAt,
        apiLastRequestId: lastRequestId,
        apiLastErrorRequestId: lastErrorRequestId,
    }), [api, loading, error, lastSuccessAt, lastRequestId, lastErrorRequestId]);

    return (
        <ApiContext.Provider value={value}>
            {children}
        </ApiContext.Provider>
    );
}

export const useApi = () => useContext(ApiContext);
