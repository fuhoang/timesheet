import React from 'react';

export default function GuestLayout({ children }) {
    return (
        <div style={{ maxWidth: 400, margin: '100px auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
            {children}
        </div>
    );
}
