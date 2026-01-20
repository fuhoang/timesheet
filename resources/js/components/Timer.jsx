import React, { useEffect, useState } from 'react';
import axios from '../lib/axios';

export default function Timer({ projectId, onChange }) {
    const [running, setRunning] = useState(false);
    const [currentEntry, setCurrentEntry] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [seconds, setSeconds] = useState(0);

    // Update the running timer every second
    useEffect(() => {
        let interval;
        if (running && currentEntry?.started_at) {
            interval = setInterval(() => {
                const start = new Date(currentEntry.started_at);
                const diff = Math.floor((new Date() - start) / 1000);
                setSeconds(diff);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [running, currentEntry]);

    async function startTimer() {
        if (!projectId) {
            setError('Please select a project');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await axios.post('/api/time-entries/start', { project_id: projectId });
            setCurrentEntry(res.data);
            setRunning(true);
            onChange?.();
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to start timer');
        } finally {
            setLoading(false);
        }
    }

    async function stopTimer() {
        setLoading(true);
        setError(null);

        try {
            const res = await axios.post('/api/time-entries/stop');
            setCurrentEntry(res.data);
            setRunning(false);
            setSeconds(0);
            onChange?.();
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to stop timer');
        } finally {
            setLoading(false);
        }
    }

    function formatTime(sec) {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${h}h ${m}m ${s}s`;
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-md space-y-4 max-w-md mx-auto">
            <h2 className="text-xl font-semibold">Timer</h2>

            {error && (
                <div className="text-red-600 text-sm bg-red-100 p-2 rounded">{error}</div>
            )}

            {running && currentEntry && (
                <div className="text-green-700 font-semibold text-lg">
                    Running: {formatTime(seconds)}
                </div>
            )}

            <div className="flex space-x-4">
                {!running ? (
                    <button
                        onClick={startTimer}
                        disabled={loading}
                        className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition"
                    >
                        Start Timer
                    </button>
                ) : (
                    <button
                        onClick={stopTimer}
                        disabled={loading}
                        className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition"
                    >
                        Stop Timer
                    </button>
                )}
            </div>
        </div>
    );
}
