import React, { useEffect, useState } from 'react';
import axios from '../lib/axios';

export default function ApiHealthStatus() {
    const [status, setStatus] = useState('checking');

    useEffect(() => {
        let active = true;

        const check = async () => {
            try {
                await axios.get('/api/health', { timeout: 3000 });
                if (active) setStatus('ok');
            } catch {
                if (active) setStatus('down');
            }
        };

        check();
        const timer = window.setInterval(check, 30000);

        return () => {
            active = false;
            window.clearInterval(timer);
        };
    }, []);

    const isUp = status === 'ok';
    const isChecking = status === 'checking';

    return (
        <div className="inline-flex items-center gap-2 text-xs text-gray-500" title="API connectivity status">
            <span
                className={[
                    'h-2 w-2 rounded-full',
                    isChecking ? 'bg-yellow-500' : (isUp ? 'bg-green-500' : 'bg-red-500'),
                ].join(' ')}
            />
            <span>{isChecking ? 'API: checking' : (isUp ? 'API: online' : 'API: offline')}</span>
        </div>
    );
}

