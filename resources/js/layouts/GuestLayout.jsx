import React from 'react';

export default function GuestLayout({ children }) {
    return (
        <div style={{ maxWidth: 400, margin: '100px auto' }}>
            {children}
        </div>
    );
}
