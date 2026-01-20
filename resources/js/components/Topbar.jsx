import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Topbar() {
    const { user, logout } = useAuth();

    return (
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
            <h1 className="font-semibold text-lg">
                Dashboard
            </h1>

            <div className="flex items-center gap-4">
                <span className="text-gray-700">
                    {user?.name}
                </span>

                <button
                    onClick={logout}
                    className="px-3 py-1 text-sm rounded bg-red-500 text-white hover:bg-red-600"
                >
                    Logout
                </button>
            </div>
        </header>
    );
}
