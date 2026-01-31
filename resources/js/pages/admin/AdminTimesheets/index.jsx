import React, { useEffect, useState } from 'react';
import { useApi } from '../../../context/ApiContext';
import { Link } from 'react-router-dom';

export default function AdminTimesheets() {
    const { api } = useApi();
    const [timesheets, setTimesheets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTimesheets();
    }, []);

    async function loadTimesheets() {
        setLoading(true);
        try {
            const res = await api({
                method: 'get',
                url: '/api/admin/timesheets',
            });
            setTimesheets(res.data);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow border">
                <h1 className="text-2xl font-semibold">Admin · Timesheets</h1>
                <p className="text-gray-600 mt-1">
                    Review and approve submitted timesheets
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow border overflow-hidden">
                {loading ? (
                    <div className="p-6 text-gray-500">Loading timesheets…</div>
                ) : timesheets.length === 0 ? (
                    <div className="p-6 text-gray-500">No submitted timesheets</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left">User</th>
                                <th className="px-4 py-3 text-left">Week</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {timesheets.map(ts => (
                                <tr key={ts.id}>
                                    <td className="px-4 py-3 font-medium">
                                        {ts.user.name}
                                    </td>
                                    <td className="px-4 py-3">
                                        {ts.work_date}
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={ts.status} />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            to={`/admin/timesheets/${ts.id}`}
                                            className="text-indigo-600 hover:underline"
                                        >
                                            Review
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const styles = {
        submitted: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
            {status}
        </span>
    );
}
