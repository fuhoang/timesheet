import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApi } from '../../../context/ApiContext';

const REPORT_LAST_REFRESH_KEY = 'reportsLastRefreshAt';

function formatTimestamp(value) {
    if (!value) return 'Never';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleString();
}

export default function AdminSystemStatusCard() {
    const { api } = useApi();
    const [loading, setLoading] = useState(true);
    const [apiStatus, setApiStatus] = useState('checking');
    const [dbStatus, setDbStatus] = useState('checking');
    const [configStatus, setConfigStatus] = useState('checking');
    const [configChecks, setConfigChecks] = useState([]);
    const [lastCheckedAt, setLastCheckedAt] = useState(null);
    const [lastReportRefreshAt, setLastReportRefreshAt] = useState(() => {
        return window.localStorage.getItem(REPORT_LAST_REFRESH_KEY);
    });

    const repoUrl = import.meta.env.VITE_GITHUB_REPO_URL || '';
    const workflowUrl = useMemo(() => {
        if (!repoUrl) return null;
        return `${repoUrl.replace(/\/$/, '')}/actions/workflows/playwright-smoke.yml`;
    }, [repoUrl]);
    const artifactsUrl = useMemo(() => {
        if (!repoUrl) return null;
        return `${repoUrl.replace(/\/$/, '')}/actions`;
    }, [repoUrl]);

    const loadStatus = useCallback(async () => {
        setLoading(true);
        try {
            const [healthResult, readyResult, configResult] = await Promise.allSettled([
                api({ method: 'get', url: '/api/health' }),
                api({ method: 'get', url: '/api/ready' }),
                api({ method: 'get', url: '/api/admin/config/health' }),
            ]);

            setApiStatus(healthResult.status === 'fulfilled' ? 'online' : 'offline');

            if (
                readyResult.status === 'fulfilled' &&
                readyResult.value?.status === 'ready'
            ) {
                setDbStatus('ready');
            } else {
                setDbStatus('not_ready');
            }

            if (configResult.status === 'fulfilled') {
                setConfigStatus(configResult.value?.ok ? 'ok' : 'issues');
                setConfigChecks(configResult.value?.checks ?? []);
            } else {
                setConfigStatus('issues');
                setConfigChecks([]);
            }
        } finally {
            setLastCheckedAt(new Date().toISOString());
            setLastReportRefreshAt(window.localStorage.getItem(REPORT_LAST_REFRESH_KEY));
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        loadStatus();
    }, [loadStatus]);

    return (
        <section className="bg-white rounded-2xl shadow border p-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900">System Status</h2>
                    <p className="text-xs text-gray-500">
                        API and database readiness for admin operations.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={loadStatus}
                    disabled={loading}
                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-60"
                >
                    {loading ? 'Checking...' : 'Refresh'}
                </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <StatusItem label="API" value={apiStatus} />
                <StatusItem label="DB" value={dbStatus} />
                <StatusItem label="Config" value={configStatus} />
                <StatusItem label="Last report refresh" value={formatTimestamp(lastReportRefreshAt)} />
                <StatusItem label="Last checked" value={formatTimestamp(lastCheckedAt)} />
            </div>

            {configStatus === 'issues' && configChecks.length > 0 && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <div className="text-xs font-semibold text-amber-900">Config issues detected</div>
                    <div className="mt-2 space-y-1">
                        {configChecks.filter(check => !check.ok).map(check => (
                            <div key={check.key} className="text-xs text-amber-800">
                                {check.label}: {check.hint || 'Check configuration values.'}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {(workflowUrl || artifactsUrl) && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {workflowUrl && (
                        <a
                            href={workflowUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                            Playwright workflow
                        </a>
                    )}
                    {artifactsUrl && (
                        <a
                            href={artifactsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            CI artifacts
                        </a>
                    )}
                </div>
            )}
        </section>
    );
}

function StatusItem({ label, value }) {
    return (
        <div className="rounded-xl border border-gray-200 px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
            <div className="mt-1 text-sm font-medium text-gray-900">{value}</div>
        </div>
    );
}
