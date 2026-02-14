import React, { useEffect, useState } from 'react';
import { useApi } from '../../../context/ApiContext';
import Toast from '../../../components/ui/Toast';
import AdminSystemStatusCard from './AdminSystemStatusCard';
import AdminTimesheetsStatusTabs from './AdminTimesheetsStatusTabs';
import AdminTimesheetsFilters from './AdminTimesheetsFilters';
import AdminTimesheetsTable from './AdminTimesheetsTable';

export default function AdminTimesheets() {
    const { api } = useApi();
    const [timesheets, setTimesheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        from: 0,
        to: 0,
        total: 0,
    });
    const [perPage, setPerPage] = useState(20);
    const [filters, setFilters] = useState({
        status: '',
        q: '',
        date_from: '',
        date_to: '',
    });
    const hasActiveFilters = !!(
        filters.status ||
        filters.q ||
        filters.date_from ||
        filters.date_to
    );

    useEffect(() => {
        loadTimesheets();
    }, []);

    async function loadTimesheets(page = 1) {
        setLoading(true);
        try {
            const res = await api({
                method: 'get',
                url: '/api/admin/timesheets',
                params: {
                    ...filters,
                    page,
                    per_page: perPage,
                },
            });
            setTimesheets(res.data);
            setPagination({
                current_page: res.current_page ?? 1,
                last_page: res.last_page ?? 1,
                from: res.from ?? 0,
                to: res.to ?? 0,
                total: res.total ?? res.data?.length ?? 0,
            });
            setSelectedIds([]);
        } finally {
            setLoading(false);
        }
    }

    const reviewableIds = timesheets
        .filter(ts => ts.submitted_at && ts.status !== 'approved')
        .map(ts => ts.id);

    const allSubmittedSelected =
        reviewableIds.length > 0 &&
        reviewableIds.every(id => selectedIds.includes(id));

    function toggleSelectAllSubmitted() {
        if (allSubmittedSelected) {
            setSelectedIds(prev =>
                prev.filter(id => !reviewableIds.includes(id))
            );
            return;
        }

        setSelectedIds(prev => {
            const next = new Set(prev);
            reviewableIds.forEach(id => next.add(id));
            return Array.from(next);
        });
    }

    function toggleSelectOne(id) {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }

    function showToast(message, type = 'success') {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }

    async function bulkApprove() {
        if (selectedIds.length === 0 || bulkLoading) return;
        if (!confirm(`Approve ${selectedIds.length} timesheet(s)?`)) return;

        setBulkLoading(true);
        try {
            const res = await api({
                method: 'post',
                url: '/api/admin/timesheets/bulk-approve',
                data: { ids: selectedIds },
            });
            showToast(res.message || 'Timesheets approved');
            await loadTimesheets();
        } catch (err) {
            showToast(
                err.response?.data?.message || 'Bulk approve failed',
                'error'
            );
        } finally {
            setBulkLoading(false);
        }
    }

    async function bulkReject() {
        if (selectedIds.length === 0 || bulkLoading) return;
        const reason = window.prompt('Rejection reason (required):');
        if (!reason || !reason.trim()) return;

        if (!confirm(`Reject ${selectedIds.length} timesheet(s)?`)) return;

        setBulkLoading(true);
        try {
            const res = await api({
                method: 'post',
                url: '/api/admin/timesheets/bulk-reject',
                data: { ids: selectedIds, reason: reason.trim() },
            });
            showToast(res.message || 'Timesheets rejected');
            await loadTimesheets();
        } catch (err) {
            showToast(
                err.response?.data?.message || 'Bulk reject failed',
                'error'
            );
        } finally {
            setBulkLoading(false);
        }
    }

    function updateFilter(key, value) {
        setFilters(prev => ({ ...prev, [key]: value }));
    }

    function applyFilters(e) {
        e?.preventDefault();
        loadTimesheets(1);
    }

    function clearFilters() {
        setFilters({ status: '', q: '', date_from: '', date_to: '' });
        loadTimesheets(1);
    }

    function setStatusTab(status) {
        setFilters(prev => ({ ...prev, status }));
        setTimeout(() => loadTimesheets(1), 0);
    }

    function goToPage(page) {
        if (page < 1 || page > pagination.last_page) return;
        loadTimesheets(page);
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow border">
                <h1 className="text-2xl font-semibold">Admin · Timesheets</h1>
                <p className="text-gray-600 mt-1">
                    Review and approve submitted timesheets
                </p>
            </div>

            <AdminSystemStatusCard />

            <AdminTimesheetsStatusTabs
                currentStatus={filters.status}
                onSelect={setStatusTab}
            />

            <AdminTimesheetsFilters
                filters={filters}
                perPage={perPage}
                onUpdateFilter={updateFilter}
                onPerPageChange={value => {
                    setPerPage(value);
                    loadTimesheets(1);
                }}
                onApply={applyFilters}
                onClear={clearFilters}
            />

            {toast && <Toast message={toast.message} type={toast.type} />}

            <AdminTimesheetsTable
                loading={loading}
                timesheets={timesheets}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
                selectedIds={selectedIds}
                bulkLoading={bulkLoading}
                onBulkApprove={bulkApprove}
                onBulkReject={bulkReject}
                pagination={pagination}
                allSubmittedSelected={allSubmittedSelected}
                onToggleSelectAll={toggleSelectAllSubmitted}
                onToggleSelectOne={toggleSelectOne}
                onGoToPage={goToPage}
            />
        </div>
    );
}
