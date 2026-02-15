import React, { useEffect, useRef, useState } from 'react';
import { useApi } from '../context/ApiContext';
import Button from './ui/Button';

export default function Timer({
    projectId,
    onChange,
    disabled,
    autoStartProjectId,
    onAutoStartComplete,
    onOptimisticStart,
    onOptimisticStop,
}) {

    const { api } = useApi();
    const [runningEntry, setRunningEntry] = useState(null);
    const [seconds, setSeconds] = useState(0);
    const [loading, setLoading] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        loadRunning();
        return () => clearInterval(intervalRef.current);
    }, []);

    useEffect(() => {
        if (disabled && runningEntry) {
            clearInterval(intervalRef.current);
            setRunningEntry(null);
            setSeconds(0);
        }
    }, [disabled]);

    useEffect(() => {
        if (!autoStartProjectId || runningEntry || loading || disabled) return;
        startWithProject(autoStartProjectId, true);
    }, [autoStartProjectId, runningEntry, loading, disabled]);


    async function loadRunning() {
        try {

            const res = await api({
                method: 'get',
                url: '/api/time-entries/running',
            });

            if (res && res.started_at) {
                setRunningEntry(res || null);

                const started = new Date(res.started_at.replace(' ', 'T'));
                const now = new Date();
                const diff = Math.floor((now - started) / 1000);

                setSeconds(diff);
                startTicking();
            } else {
                setRunningEntry(null);
                setSeconds(0);
            }
        } catch (err) {
            console.error(err);
        }
    }

    function startTicking() {
        clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            setSeconds(prev => prev + 1);
        }, 1000);
    }

    function stopTicking() {
        clearInterval(intervalRef.current);
    }

    async function start() {
        if (!projectId) {
            alert('Please select a project');
            return;
        }

        await startWithProject(projectId);
    }

    async function startWithProject(startProjectId, isAuto = false) {
        if (!startProjectId) return;
        const optimisticEntry = {
            id: `optimistic-${Date.now()}`,
            project_id: startProjectId,
            started_at: new Date().toISOString(),
            ended_at: null,
        };

        setRunningEntry(optimisticEntry);
        setSeconds(0);
        startTicking();
        onOptimisticStart?.(optimisticEntry);

        setLoading(true);

        try {
            const res = await api({
                method: 'post',
                url: '/api/time-entries/start',
                data: {
                    project_id: startProjectId,
                },
            });

            setRunningEntry(res);

            onChange?.();
            if (isAuto) onAutoStartComplete?.(startProjectId);
        } catch (err) {
            alert(err.response?.data?.message ?? 'Unable to start timer');
            stopTicking();
            setRunningEntry(null);
            setSeconds(0);
            onOptimisticStop?.();
            if (isAuto) onAutoStartComplete?.(startProjectId);
        } finally {
            setLoading(false);
        }
    }

    async function stop() {
        const previousEntry = runningEntry;
        const previousSeconds = seconds;

        stopTicking();
        setRunningEntry(null);
        setSeconds(0);
        onOptimisticStop?.();

        setLoading(true);

        try {
            await api({
                method: 'post',
                url: '/api/time-entries/stop',
            });

            onChange?.();
        } catch (err) {
            console.error(err.response?.data);
            setRunningEntry(previousEntry || null);
            setSeconds(previousSeconds);
            if (previousEntry) {
                startTicking();
                onOptimisticStart?.(previousEntry);
            }
            alert(err.response?.data?.message ?? 'Unable to stop timer');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-4">

            <div className="text-3xl font-mono font-semibold">
                {formatSeconds(seconds)}
            </div>

            <div className="flex items-center gap-4">
                {runningEntry ? (
                    <>
                        <span className="text-green-600 dark:text-green-300 font-medium">Running</span>
                        <Button
                            onClick={stop}
                            disabled={loading || disabled}
                            variant="danger"
                            size="lg"
                        >
                            Stop
                        </Button>
                    </>
                ) : (
                    <Button
                        onClick={start}
                        disabled={loading || disabled || !projectId}
                        variant="success"
                        size="lg"
                    >
                        Start
                    </Button>
                )}
            </div>
        </div>
    );
}

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
