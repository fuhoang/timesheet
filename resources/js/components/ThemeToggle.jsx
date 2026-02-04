import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'theme';

function getInitialTheme() {
    if (typeof window === 'undefined') return 'light';
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
}

export default function ThemeToggle({ className = '' }) {
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        const initial = getInitialTheme();
        setTheme(initial);
        document.documentElement.classList.toggle('dark', initial === 'dark');
    }, []);

    function toggleTheme() {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        document.documentElement.classList.toggle('dark', next === 'dark');
        window.localStorage.setItem(STORAGE_KEY, next);
    }

    return (
        <button
            onClick={toggleTheme}
            className={`px-3 py-1 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-100 ${className}`}
            type="button"
        >
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
    );
}
