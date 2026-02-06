import React from 'react';

export default function Toast({ message, type = 'success' }) {
    if (!message) return null;

    return (
        <div
            className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white shadow-lg ${
                type === 'error' ? 'bg-red-600' : 'bg-green-600'
            }`}
        >
            {message}
        </div>
    );
}
