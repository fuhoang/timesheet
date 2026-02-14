import React, { useCallback, useEffect, useState } from 'react';
import { useApi } from '../../../context/ApiContext';

export default function AdminSystem() {
    const { api } = useApi();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [payload, setPayload] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api({ method: 'get', url: '/api/admin/config/health' });
            setPayload(res);
        } catch (err) {
            setError(err?.response?.data?.message || 'Unable to load system diagnostics.');
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        load();
    }, [load]);

    const checks = payload?.checks ?? [];
    const failed = checks.filter(check => !check.ok);

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
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                    {error}
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
                                    {check.ok ? '—' : (check.hint || 'Check configuration values.')}
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
