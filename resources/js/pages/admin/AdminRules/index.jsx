import React, { useEffect, useState } from 'react';
import { useApi } from '../../../context/ApiContext';
import InlineAlert from '../../../components/ui/InlineAlert';
import { getApiErrorDetails } from '../../../utils/apiError';

export default function AdminRules() {
    const { api } = useApi();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [payload, setPayload] = useState(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api({
                    method: 'get',
                    url: '/api/admin/rules',
                });
                setPayload(res);
            } catch (err) {
                setError(getApiErrorDetails(err, 'Failed to load admin rules.'));
            } finally {
                setLoading(false);
            }
        })();
    }, [api]);

    const actions = payload?.admin_actions ?? [];
    const reasons = payload?.rule_reasons ?? {};
    const overrideFields = payload?.override_contract?.fields ?? [];
    const auditFields = payload?.override_contract?.audit_payload ?? [];

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow border">
                <h1 className="text-2xl font-semibold">Admin · Rules</h1>
                <p className="text-gray-600 mt-1">
                    Workflow guards, blocked reasons, and override/audit contract.
                </p>
            </div>

            {error && (
                <InlineAlert requestId={error.requestId}>
                    {error.message}
                </InlineAlert>
            )}

            <div className="bg-white rounded-2xl shadow border overflow-hidden">
                <div className="px-4 py-3 border-b text-sm font-semibold text-gray-900">
                    Admin Actions
                </div>
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left">Action</th>
                            <th className="px-4 py-3 text-left">Allowed when</th>
                            <th className="px-4 py-3 text-left">Blocked reasons</th>
                            <th className="px-4 py-3 text-left">Override</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading && (
                            <tr>
                                <td colSpan={4} className="px-4 py-4 text-gray-500">Loading rules...</td>
                            </tr>
                        )}
                        {!loading && actions.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-4 text-gray-500">No rules found.</td>
                            </tr>
                        )}
                        {!loading && actions.map(action => (
                            <tr key={action.action}>
                                <td className="px-4 py-3 font-medium text-gray-900">{action.action}</td>
                                <td className="px-4 py-3 text-gray-700">{action.allowed_when}</td>
                                <td className="px-4 py-3 text-gray-700">{(action.blocked_reasons || []).join(', ') || '—'}</td>
                                <td className="px-4 py-3 text-gray-700">
                                    {action.override_supported
                                        ? `Supported${action.override_requires_reason ? ' (reason required)' : ''}`
                                        : 'Not supported'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-white rounded-2xl shadow border p-4">
                <div className="text-sm font-semibold text-gray-900">Rule Reasons</div>
                <div className="mt-3 space-y-2 text-sm">
                    {Object.keys(reasons).length === 0 && (
                        <div className="text-gray-500">No rule reasons available.</div>
                    )}
                    {Object.entries(reasons).map(([key, text]) => (
                        <div key={key} className="rounded-lg border border-gray-200 px-3 py-2">
                            <div className="font-mono text-xs text-gray-800">{key}</div>
                            <div className="text-gray-600">{text}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow border p-4">
                <div className="text-sm font-semibold text-gray-900">Override Contract</div>
                <div className="mt-3 text-sm text-gray-700">
                    <div>Request fields: {overrideFields.join(', ') || '—'}</div>
                    <div className="mt-2">Audit context fields: {auditFields.join(', ') || '—'}</div>
                </div>
            </div>
        </div>
    );
}

