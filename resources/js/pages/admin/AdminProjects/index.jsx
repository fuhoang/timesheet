import React, { useState } from 'react';
import { useApi } from '../../../context/ApiContext';
import { useProjects } from '../../../context/ProjectContext';
import { TableSkeleton } from '../../../components/skeletons/TableSkeleton';

import ProjectEditModal from './ProjectEditModal';
import ProjectForm from './ProjectForm';
import ProjectTable from './ProjectTable';

export default function AdminProjects() {
    const { api } = useApi();
    const { projects, loading, reloadProjects } = useProjects();

    const [editingProject, setEditingProject] = useState(null);
    const [savingEdit, setSavingEdit] = useState(false);

    const [toast, setToast] = useState(null);

    const handleSaveEdit = async (data, setErrors) => {
    setSavingEdit(true);
    try {
        await api({
            method: 'patch',
            url: `/api/admin/projects/${editingProject.id}`,
            data,
        });
        setEditingProject(null);
        await reloadProjects();
        showToast('Project updated successfully');
    } catch (err) {
        if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        } else {
        showToast('Failed to update project', 'error');
        }
    } finally {
        setSavingEdit(false);
    }
    };




    function showToast(message, type = 'success') {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }

    return (
        <div className="space-y-6 relative">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg text-white shadow-lg z-50
                    ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow border">
                <h1 className="text-2xl font-semibold">Admin · Projects</h1>
                <p className="text-gray-600 mt-1">Manage all company projects</p>
            </div>

            {/* Project form */}
            <ProjectForm
                api={api}
                reloadProjects={reloadProjects}
                editingProject={editingProject}
                setEditingProject={setEditingProject}
                showToast={showToast}
            />

            {/* Projects table */}
            {loading ? (
                <TableSkeleton rows={6} />
            ) : (
                <ProjectTable
                    projects={projects}
                    api={api}
                    reloadProjects={reloadProjects}
                    setEditingProject={setEditingProject}
                    showToast={showToast}
                />
            )}

            {/* Edit Project Modal */}
            <ProjectEditModal
            project={editingProject}
            onClose={() => setEditingProject(null)}
            onSave={handleSaveEdit}
            saving={savingEdit}
            />

        </div>
    );
}
