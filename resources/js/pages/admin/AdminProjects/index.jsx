import React, { useState } from 'react';
import { useApi } from '../../../context/ApiContext';
import { useProjects } from '../../../context/ProjectContext';
import { TableSkeleton } from '../../../components/skeletons/TableSkeleton';

import ProjectEditModal from './ProjectEditModal';
import ProjectForm from './ProjectForm';
import ProjectTable from './ProjectTable';
import Toast from '../../../components/ui/Toast';
import { getApiErrorDetails } from '../../../utils/apiError';
import ConfirmActionModal from '../../../components/ui/ConfirmActionModal';

export default function AdminProjects() {
    const { api } = useApi();
    const { projects, loading, reloadProjects } = useProjects();

    const [editingProject, setEditingProject] = useState(null);
    const [savingEdit, setSavingEdit] = useState(false);
    const [deletingProject, setDeletingProject] = useState(null);
    const [deleting, setDeleting] = useState(false);

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
        showToast(getApiErrorDetails(err, 'Failed to update project').fullMessage, 'error');
        }
    } finally {
        setSavingEdit(false);
    }
    };




    function showToast(message, type = 'success') {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }

    const handleDeleteProject = async () => {
        if (!deletingProject) return;
        setDeleting(true);
        try {
            await api({ method: 'delete', url: `/api/admin/projects/${deletingProject.id}` });
            await reloadProjects();
            showToast('Project deleted');
            setDeletingProject(null);
        } catch (err) {
            showToast(getApiErrorDetails(err, 'Failed to delete project').fullMessage, 'error');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6 relative">
            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} />}

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
                    setEditingProject={setEditingProject}
                    onRequestDelete={setDeletingProject}
                />
            )}

            {/* Edit Project Modal */}
            <ProjectEditModal
            project={editingProject}
            onClose={() => setEditingProject(null)}
            onSave={handleSaveEdit}
            saving={savingEdit}
            />

            <ConfirmActionModal
                open={!!deletingProject}
                title="Delete project"
                message={deletingProject ? `Delete "${deletingProject.name}"? This cannot be undone.` : ''}
                confirmText="Delete"
                loading={deleting}
                onClose={() => setDeletingProject(null)}
                onConfirm={handleDeleteProject}
            />

        </div>
    );
}
