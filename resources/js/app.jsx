import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminProjects from './pages/admin/Projects';


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

                {/* Admin */}
                <Route
                    path="/admin/projects"
                    element={
                        <ProtectedRoute>
                            <AdminRoute>
                                <AuthLayout>
                                    <DashboardLayout>
                                        <AdminProjects />
                                    </DashboardLayout>
                                </AuthLayout>
                            </AdminRoute>
                        </ProtectedRoute>
                    }
                />

            </Routes>
        </AuthProvider>
    );
}
