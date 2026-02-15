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
    const [bulkRetrySeconds, setBulkRetrySeconds] = useState(0);
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

    useEffect(() => {
        if (bulkRetrySeconds <= 0) return undefined;
        const timer = window.setInterval(() => {
            setBulkRetrySeconds(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [bulkRetrySeconds]);

    async function loadTimesheets(page = 1, nextFilters = filters, nextPerPage = perPage) {
        setLoading(true);
        try {
            const res = await api({
                method: 'get',
                url: '/api/admin/timesheets',
                params: {
                    ...nextFilters,
                    page,
                    per_page: nextPerPage,
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
        if (selectedIds.length === 0 || bulkLoading || bulkRetrySeconds > 0) return;
        if (!confirm(`Approve ${selectedIds.length} timesheet(s)?`)) return;

        setBulkLoading(true);
        try {
            const res = await api({
                method: 'post',
                url: '/api/admin/timesheets/bulk-approve',
                data: { ids: selectedIds },
            });
            showToast(
                `${res.message || 'Timesheets approved'} (${res.approved_count ?? 0} approved, ${res.skipped_count ?? 0} skipped)`
            );
            await loadTimesheets();
        } catch (err) {
            if (err.response?.status === 429) {
                const retryAfter = Number(err.response?.headers?.['retry-after'] || 60);
                setBulkRetrySeconds(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60);
            }
            showToast(
                err.response?.data?.message || 'Bulk approve failed',
                'error'
            );
        } finally {
            setBulkLoading(false);
        }
    }

    async function bulkReject() {
        if (selectedIds.length === 0 || bulkLoading || bulkRetrySeconds > 0) return;
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
            showToast(
                `${res.message || 'Timesheets rejected'} (${res.rejected_count ?? 0} rejected, ${res.skipped_count ?? 0} skipped)`
            );
            await loadTimesheets();
        } catch (err) {
            if (err.response?.status === 429) {
                const retryAfter = Number(err.response?.headers?.['retry-after'] || 60);
                setBulkRetrySeconds(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60);
            }
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
        loadTimesheets(1, filters, perPage);
    }

    function clearFilters() {
        const cleared = { status: '', q: '', date_from: '', date_to: '' };
        setFilters(cleared);
        loadTimesheets(1, cleared, perPage);
    }

    function setStatusTab(status) {
        const updated = { ...filters, status };
        setFilters(updated);
        loadTimesheets(1, updated, perPage);
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
                    loadTimesheets(1, filters, value);
                }}
                onApply={applyFilters}
                onClear={clearFilters}
            />

            {toast && <Toast message={toast.message} type={toast.type} />}

            {bulkRetrySeconds > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Bulk actions are temporarily rate-limited. Try again in {bulkRetrySeconds}s.
                </div>
            )}

            <AdminTimesheetsTable
                loading={loading}
                timesheets={timesheets}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
                selectedIds={selectedIds}
                bulkLoading={bulkLoading || bulkRetrySeconds > 0}
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
