import React, { useEffect, useMemo, useState } from 'react';
import axios from '../../lib/axios';
import { useApi } from '../../context/ApiContext';

function formatDate(date) {
    return date.toISOString().slice(0, 10);
}

function getWeekRange(reference = new Date()) {
    const date = new Date(reference);
    const day = (date.getDay() + 6) % 7;
    const start = new Date(date);
    start.setDate(date.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
}

export default function Reports() {
    const { api, apiLoading } = useApi();
    const [{ start, end }] = useState(() => getWeekRange());
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(false);

    const startDate = useMemo(() => formatDate(start), [start]);
    const endDate = useMemo(() => formatDate(end), [end]);

    useEffect(() => {
        let mounted = true;

        api({
            method: 'get',
            url: '/api/reports',
            params: {
                start: startDate,
                end: endDate,
            },
        })
            .then(data => {
                if (mounted) {
                    setReport(data);
                }
            })
            .catch(err => {
                if (mounted) {
                    setError(err);
                }
            });

        return () => {
            mounted = false;
        };
    }, [api, startDate, endDate]);

    async function handleExport() {
        setExporting(true);
        try {
            const response = await axios.get('/api/reports', {
                params: {
                    start: startDate,
                    end: endDate,
                    format: 'csv',
                },
                responseType: 'blob',
            });

            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `report-${startDate}-to-${endDate}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } finally {
            setExporting(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
                    <p className="text-sm text-gray-500">
                        Weekly summary ({startDate} to {endDate}) grouped by user.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleExport}
                    disabled={exporting}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60"
                >
                    {exporting ? 'Exporting...' : 'Export CSV'}
                </button>
            </div>

            {apiLoading && (
                <div className="text-sm text-gray-500">Loading report...</div>
            )}

            {error && (
                <div className="text-sm text-red-600">
                    Unable to load reports. Please try again.
                </div>
            )}

            {!apiLoading && report?.rows?.length === 0 && (
                <div className="text-sm text-gray-500">
                    No entries found for this week.
                </div>
            )}

            {report?.rows?.map(row => (
                <div
                    key={row.user?.id ?? row.user?.email ?? Math.random()}
                    className="bg-white border rounded-xl p-5 shadow-sm space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-lg font-semibold text-gray-900">
                                {row.user?.name ?? 'Unknown user'}
                            </div>
                            <div className="text-sm text-gray-500">
                                {row.user?.email ?? 'No email'}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs uppercase text-gray-400">Total</div>
                            <div className="text-lg font-semibold text-gray-900">
                                {Math.round(row.total_minutes / 60)}h {row.total_minutes % 60}m
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {row.days.map(day => (
                            <div
                                key={`${row.user?.id ?? 'user'}-${day.date}`}
                                className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 flex items-center justify-between"
                            >
                                <div className="text-sm font-medium text-gray-700">
                                    {day.date}
                                </div>
                                <div className="text-sm font-semibold text-gray-900">
                                    {Math.round(day.total_minutes / 60)}h {day.total_minutes % 60}m
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
