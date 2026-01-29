import React from 'react';
import { Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { ApiProvider } from './context/ApiContext';
import { ProjectProvider } from './context/ProjectContext';

import AdminRoute from './components/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';

import AdminLayout from './layouts/AdminLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

import AdminProjects from './pages/admin/AdminProjects';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Timesheets from './pages/timesheets';


export default function App() {
    return (
        <AuthProvider>
            <ApiProvider>
                <ProjectProvider>
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

                        {/* Timesheet */}
                        <Route
                            path="/timesheets"
                            element={
                                <ProtectedRoute>
                                    <AuthLayout>
                                        <DashboardLayout>
                                            <Timesheets />
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
                                        <AdminLayout>
                                            <AdminProjects />
                                        </AdminLayout>
                                    </AdminRoute>
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </ProjectProvider>
            </ApiProvider>
        </AuthProvider>
    );
}
