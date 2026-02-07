import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import Button from './ui/Button';

export default function Topbar() {
    const { user, logout } = useAuth();

    return (
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
            <h1 className="font-semibold text-lg">
                Dashboard
            </h1>

            <div className="flex items-center gap-4">
                <ThemeToggle />

                {user?.is_admin ? (
                    <Link
                        to="/admin/timesheets"
                        className="px-3 py-1 text-sm rounded border border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                        Admin
                    </Link>
                ) : null}

                <span className="text-gray-700">
                    {user?.name}
                </span>

                <Button onClick={logout} variant="danger" size="sm">
                    Logout
                </Button>
            </div>
        </header>
    );
}
