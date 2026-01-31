import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../../context/ApiContext';
import RejectModal from './RejectModal';

export default function AdminTimesheetShow() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { api } = useApi();

    const [timesheet, setTimesheet] = useState(null);
    const [rejecting, setRejecting] = useState(false);

    useEffect(() => {
        loadTimesheet();
    }, []);

    async function loadTimesheet() {
        const res = await api({
            method: 'get',
            url: `/api/admin/timesheets/${id}`,
        });
        setTimesheet(res);
    }

    async function approve() {
        await api({
            method: 'post',
            url: `/api/admin/timesheets/${id}/approve`,
        });
        navigate('/admin/timesheets');
    }

    if (!timesheet) {
        return <div className="p-6 text-gray-500">Loading…</div>;
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow border">
                <h1 className="text-2xl font-semibold">
                    {timesheet.user.name}
                </h1>
                <p className="text-gray-600 mt-1">
                    Week starting {timesheet.work_date}
                </p>
            </div>

            {/* Entries */}
            <div className="bg-white rounded-2xl shadow border divide-y">
                {timesheet.entries.map(entry => (
                    <div key={entry.id} className="p-4 flex justify-between text-sm">
                        <div>
                            <div className="font-medium">{entry.project.name}</div>
                            {entry.description && (
                                <div className="text-gray-500">{entry.description}</div>
                            )}
                        </div>
                        <div className="text-right font-mono">
                            {entry.duration_minutes} min
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions */}
            {timesheet.status === 'submitted' && (
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => setRejecting(true)}
                        className="px-4 py-2 rounded-lg border hover:bg-gray-100"
                    >
                        Reject
                    </button>
                    <button
                        onClick={approve}
                        className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                    >
                        Approve
                    </button>
                </div>
            )}

            {rejecting && (
                <RejectModal
                    timesheetId={id}
                    onClose={() => setRejecting(false)}
                    onDone={() => navigate('/admin/timesheets')}
                />
            )}
        </div>
    );
}
