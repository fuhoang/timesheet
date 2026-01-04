import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthLayout({ children }) {
    const { user, logout, loading } = useAuth();

    if (loading) return <p>Loading...</p>;
    if (!user) return <p>You are not logged in.</p>;

    return (
        <div>
            <header style={{ padding: 16, borderBottom: '1px solid #ccc' }}>
                Logged in as {user.name}
                <button onClick={logout} style={{ marginLeft: 16 }}>
                    Logout
                </button>
            </header>

            <main style={{ padding: 24 }}>
                {children}
            </main>
        </div>
    );
}
