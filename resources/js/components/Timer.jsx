import React, { useEffect, useRef, useState } from 'react';
import axios from '../lib/axios';

export default function Timer({ projectId, onChange, disabled }) {
    const [runningEntry, setRunningEntry] = useState(null);
    const [seconds, setSeconds] = useState(0);
    const [loading, setLoading] = useState(false);
    const intervalRef = useRef(null);

    /* ----------------------------------
       Load running timer on mount
    ---------------------------------- */
    useEffect(() => {
        loadRunning();
        return () => clearInterval(intervalRef.current);
    }, []);

    async function loadRunning() {
        try {
            const res = await axios.get('/api/time-entries/running');

            // Safety check: ensure res.data exists and has started_at
            if (res.data && res.data.started_at) {
                setRunningEntry(res.data || null);

                const started = new Date(res.data.started_at.replace(' ', 'T'));
                const now = new Date();
                const diff = Math.floor((now - started) / 1000);

                setSeconds(diff);
                startTicking();
            } else {
                // No running timer
                setRunningEntry(null);
                setSeconds(0);
            }
        } catch (err) {
            console.error(err);
        }
    }

    /* ----------------------------------
       Timer ticking
    ---------------------------------- */
    function startTicking() {
        clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            setSeconds(prev => prev + 1);
        }, 1000);
    }

    function stopTicking() {
        clearInterval(intervalRef.current);
    }

    /* ----------------------------------
       Start timer
    ---------------------------------- */
    async function start() {
        if (!projectId) {
            alert('Please select a project');
            return;
        }

        setLoading(true);

        try {
            const res = await axios.post('/api/time-entries/start', {
                project_id: projectId,
            });

            setRunningEntry(res.data);
            setSeconds(0);
            startTicking();

            onChange?.();
        } catch (err) {
            alert(err.response?.data?.message ?? 'Unable to start timer');
        } finally {
            setLoading(false);
        }
    }

    /* ----------------------------------
       Stop timer
    ---------------------------------- */
    async function stop() {
        setLoading(true);

        try {
            const res = await axios.post('/api/time-entries/stop');

            stopTicking();
            setRunningEntry(null);
            setSeconds(0);

            onChange?.();
        } catch (err) {
            console.error(err.response?.data);
            alert(err.response?.data?.message ?? 'Unable to stop timer');
        } finally {
            setLoading(false);
        }
    }

    /* ----------------------------------
       UI
    ---------------------------------- */
    return (
        <div className="space-y-4">

            {/* Time display */}
            <div className="text-3xl font-mono font-semibold">
                {formatSeconds(seconds)}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-4">
                {runningEntry ? (
                    <>
                        <span className="text-green-600 font-medium">Running</span>
                        <button
                            onClick={stop}
                            disabled={loading || disabled}
                            className="px-6 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
                        >
                            Stop
                        </button>
                    </>
                ) : (
                    <button
                        onClick={start}
                        disabled={loading || disabled || !projectId}
                        className="px-6 py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                        Start
                    </button>
                )}
            </div>
        </div>
    );
}

/* ----------------------------------
   Helpers
---------------------------------- */
function formatSeconds(total) {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;

    return [
        h.toString().padStart(2, '0'),
        m.toString().padStart(2, '0'),
        s.toString().padStart(2, '0'),
    ].join(':');
}
