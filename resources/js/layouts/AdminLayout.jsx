import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useApi } from '../context/ApiContext';

export default function AdminLayout({ children }) {
    const { apiLoading, apiLastSuccessAt, apiLastErrorRequestId } = useApi();
    const lastSyncText = apiLastSuccessAt
        ? new Date(apiLastSuccessAt).toLocaleTimeString()
        : 'No successful sync yet';

    const navClass = ({ isActive }) =>
        `block px-3 py-2 rounded transition app-nav-link ${
            isActive ? 'app-nav-link-active' : 'hover:bg-gray-100'
        }`;

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
                    <NavLink
                        to="/admin/projects"
                        className={navClass}
                    >
                        Projects
                    </NavLink>
                    <NavLink
                        to="/admin/users"
                        className={navClass}
                    >
                        Users
                    </NavLink>
                </nav>

                <nav className="px-4 space-y-2">
                    <NavLink
                        to="/admin/timesheets"
                        className={navClass}
                    >
                        Timesheets
                    </NavLink>
                    <NavLink
                        to="/admin/rules"
                        className={navClass}
                    >
                        Rules
                    </NavLink>
                    <NavLink
                        to="/admin/system"
                        className={navClass}
                    >
                        System
                    </NavLink>
                </nav>

            </aside>

            {/* Content */}
            <main className="flex-1 p-8">
                <div className="mb-4 rounded-xl border bg-white px-4 py-2 text-xs text-gray-600 flex flex-wrap items-center gap-2">
                    <span className={apiLoading ? 'text-blue-700 font-medium' : ''}>
                        {apiLoading ? 'Syncing…' : `Last successful sync: ${lastSyncText}`}
                    </span>
                    {apiLastErrorRequestId && (
                        <span className="text-amber-700">
                            Last error request ID: {apiLastErrorRequestId}
                        </span>
                    )}
                </div>
                {children}
            </main>

        </div>
    );
}
