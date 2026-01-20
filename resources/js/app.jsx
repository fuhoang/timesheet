import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

export default function App() {
    return (
        <AuthProvider>
            <Routes>

                {/* Public */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <AuthLayout>
                                <DashboardLayout>
                                    <Dashboard />
                                </DashboardLayout>
                            </AuthLayout>
                        </ProtectedRoute>
                    }
                />

            </Routes>
        </AuthProvider>
    );
}
