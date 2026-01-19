import React, { useEffect, useState } from 'react';
import axios from '../lib/axios';

export default function Timer({ onChange }) {
    const [running, setRunning] = useState(false);
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        let interval;

        if (running) {
            interval = setInterval(() => {
                setSeconds(s => s + 1);
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [running]);

    async function start() {
        const projectId = document.getElementById('project').value;

        if (!projectId) {
            alert('Select a project');
            return;
        }

        await axios.post('/api/time-entries/start', {
            project_id: projectId,
        });

        setSeconds(0);
        setRunning(true);
        onChange();
    }

    async function stop() {
        await axios.post('/api/time-entries/stop');

        setRunning(false);
        setSeconds(0);
        onChange();
    }

    return (
        <div style={{ marginTop: 20 }}>
            <h3>
                Timer: {Math.floor(seconds / 60)}:
                {(seconds % 60).toString().padStart(2, '0')}
            </h3>

            {!running ? (
                <button onClick={start}>Start</button>
            ) : (
                <button onClick={stop}>Stop</button>
            )}
        </div>
    );
}
