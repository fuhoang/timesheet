import React, { useCallback, useEffect, useState } from 'react';
import { useApi } from '../../../context/ApiContext';
import InlineAlert from '../../../components/ui/InlineAlert';
import { getApiErrorDetails } from '../../../utils/apiError';

export default function AdminSystem() {
    const { api } = useApi();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [payload, setPayload] = useState(null);
    const [fixingWeekStatus, setFixingWeekStatus] = useState(false);
    const [fixResult, setFixResult] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api({ method: 'get', url: '/api/admin/config/health' });
            setPayload(res);
        } catch (err) {
            setError(getApiErrorDetails(err, 'Unable to load system diagnostics.'));
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        load();
    }, [load]);

    const checks = payload?.checks ?? [];
    const failed = checks.filter(check => !check.ok);
    const values = payload?.values ?? {};

    async function copyText(value) {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(value);
        } catch {
            // No-op fallback; user can still copy from text.
        }
    }

    async function fixInProgressWeekStatuses() {
        setFixingWeekStatus(true);
        setFixResult(null);
        setError(null);
        try {
            const res = await api({ method: 'post', url: '/api/admin/config/fix-in-progress-week' });
            setFixResult(`Fixed ${res.fixed_count ?? 0} row(s).`);
            await load();
        } catch (err) {
            setError(getApiErrorDetails(err, 'Unable to fix in-progress week statuses.'));
        } finally {
            setFixingWeekStatus(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow border flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Admin · System Diagnostics</h1>
                    <p className="text-gray-600 mt-1">
                        Environment and auth boundary checks for APP/CORS/Sanctum configuration.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={load}
                    disabled={loading}
                    className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-60"
                >
                    {loading ? 'Checking...' : 'Refresh'}
                </button>
            </div>

            {error && (
                <InlineAlert requestId={error.requestId}>
                    {error.message}
                </InlineAlert>
            )}

            {fixResult && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
                    {fixResult}
                </div>
            )}

            {!error && (
                <div className="bg-white p-4 rounded-2xl shadow border">
                    <div className="text-sm text-gray-600">
                        Overall status:{' '}
                        <span className={payload?.ok ? 'text-green-700 font-semibold' : 'text-amber-700 font-semibold'}>
                            {payload?.ok ? 'Healthy' : 'Issues detected'}
                        </span>
                        {!loading && (
                            <span className="ml-2 text-gray-400">
                                ({payload?.failed_count ?? 0} failing)
                            </span>
                        )}
                    </div>
                </div>
            )}

            {!error && (
                <div className="bg-white p-4 rounded-2xl shadow border">
                    <div className="text-sm font-semibold text-gray-900">Parsed Config Values</div>
                    <div className="mt-3 grid gap-2 text-xs">
                        <ValueRow label="APP_URL" value={values.app_url} onCopy={copyText} />
                        <ValueRow label="FRONTEND_URL" value={values.frontend_url} onCopy={copyText} />
                        <ValueRow label="APP host:port" value={values.app_host_port} onCopy={copyText} />
                        <ValueRow label="FRONTEND host:port" value={values.frontend_host_port} onCopy={copyText} />
                        <ValueRow
                            label="CORS_ALLOWED_ORIGINS"
                            value={(values.cors_allowed_origins || []).join(',')}
                            onCopy={copyText}
                        />
                        <ValueRow
                            label="SANCTUM_STATEFUL_DOMAINS"
                            value={(values.sanctum_stateful_domains || []).join(',')}
                            onCopy={copyText}
                        />
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left">Check</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Hint</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading && (
                            <tr>
                                <td colSpan={3} className="px-4 py-4 text-gray-500">
                                    Loading diagnostics...
                                </td>
                            </tr>
                        )}
                        {!loading && checks.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-4 py-4 text-gray-500">
                                    No diagnostics available.
                                </td>
                            </tr>
                        )}
                        {!loading && checks.map(check => (
                            <tr key={check.key}>
                                <td className="px-4 py-3 font-medium text-gray-900">{check.label}</td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${check.ok ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`}
                                    >
                                        {check.ok ? 'OK' : 'Fail'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {check.ok ? (
                                        '—'
                                    ) : (
                                        <div className="space-y-2">
                                            <div>{check.hint || 'Check configuration values.'}</div>
                                            {check.copy_fix && (
                                                <button
                                                    type="button"
                                                    onClick={() => copyText(check.copy_fix)}
                                                    className="px-2 py-1 rounded border border-gray-300 text-xs text-gray-700 hover:bg-gray-50"
                                                >
                                                    Copy fix
                                                </button>
                                            )}
                                            {check.key === 'in_progress_week_statuses' && !check.ok && (
                                                <button
                                                    type="button"
                                                    onClick={fixInProgressWeekStatuses}
                                                    disabled={fixingWeekStatus}
                                                    className="px-2 py-1 rounded border border-amber-300 text-xs text-amber-800 hover:bg-amber-50 disabled:opacity-60"
                                                >
                                                    {fixingWeekStatus ? 'Fixing...' : 'Fix now'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {!loading && failed.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="text-sm font-semibold text-amber-900">Action Required</div>
                    <div className="mt-2 space-y-1">
                        {failed.map(check => (
                            <div key={`failed-${check.key}`} className="text-sm text-amber-800">
                                {check.label}: {check.hint || 'Check configuration values.'}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function ValueRow({ label, value, onCopy }) {
    return (
        <div className="rounded-lg border border-gray-200 px-3 py-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
                <div className="text-gray-500">{label}</div>
                <div className="font-mono text-gray-800 truncate">{value || '—'}</div>
            </div>
            {value && (
                <button
                    type="button"
                    onClick={() => onCopy(value)}
                    className="px-2 py-1 rounded border border-gray-300 text-xs text-gray-700 hover:bg-gray-50"
                >
                    Copy
                </button>
            )}
        </div>
    );
}
