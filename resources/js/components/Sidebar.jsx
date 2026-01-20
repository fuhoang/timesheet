import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
    const linkClass = ({ isActive }) =>
        `block px-4 py-2 rounded-lg transition ${
            isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-200'
        }`;

    return (
        <aside className="w-64 bg-white border-r">
            <div className="p-6 font-bold text-xl">
                Timesheet
            </div>

            <nav className="px-4 space-y-1">
                <NavLink to="/" className={linkClass}>
                    Dashboard
                </NavLink>

                <NavLink to="/timesheets" className={linkClass}>
                    Timesheets
                </NavLink>

                <NavLink to="/reports" className={linkClass}>
                    Reports
                </NavLink>
            </nav>
        </aside>
    );
}
