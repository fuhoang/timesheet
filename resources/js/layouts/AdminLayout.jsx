import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

export default function AdminLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-100 flex">

            {/* Sidebar */}
            <aside className="w-64 bg-white border-r">
                <div className="p-6 font-semibold text-lg">
                    Admin
                </div>

                <div className="px-4 pb-4">
                    <Link
                        to="/"
                        className="block px-3 py-2 rounded border border-gray-200 text-gray-700 hover:bg-gray-100"
                    >
                        Back to Dashboard
                    </Link>
                </div>

                <div className="px-4 pb-4">
                    <ThemeToggle className="w-full text-left" />
                </div>

                <nav className="px-4 space-y-2">
                    <Link
                        to="/admin/projects"
                        className="block px-3 py-2 rounded hover:bg-gray-100"
                    >
                        Projects
                    </Link>
                    <Link
                        to="/admin/users"
                        className="block px-3 py-2 rounded hover:bg-gray-100"
                    >
                        Users
                    </Link>
                </nav>

                <nav className="px-4 space-y-2">
                    <Link
                        to="/admin/timesheets"
                        className="block px-3 py-2 rounded hover:bg-gray-100"
                    >
                        Timesheets
                    </Link>
                    <Link
                        to="/admin/system"
                        className="block px-3 py-2 rounded hover:bg-gray-100"
                    >
                        System
                    </Link>
                </nav>

            </aside>

            {/* Content */}
            <main className="flex-1 p-8">
                {children}
            </main>

        </div>
    );
}
