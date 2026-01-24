import React from 'react';
import { Link } from 'react-router-dom';

export default function AdminLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-100 flex">

            {/* Sidebar */}
            <aside className="w-64 bg-white border-r">
                <div className="p-6 font-semibold text-lg">
                    Admin
                </div>

                <nav className="px-4 space-y-2">
                    <Link
                        to="/admin/projects"
                        className="block px-3 py-2 rounded hover:bg-gray-100"
                    >
                        Projects
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
