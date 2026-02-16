import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import WeekHeader from '../timesheets/components/WeekHeader';
import DayCard from '../timesheets/components/DayCard';
import AdminTimesheetsTable from '../admin/AdminTimesheets/AdminTimesheetsTable';

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 1, name: 'Admin User', is_admin: 1 },
    }),
}));

vi.mock('../../context/ApiContext', () => ({
    useApi: () => ({
        api: vi.fn(),
    }),
}));

describe('Core pages visual regression', () => {
    afterEach(() => {
        document.documentElement.classList.remove('dark');
    });

    it('Sidebar snapshot in light mode', () => {
        const { container } = render(
            <MemoryRouter initialEntries={['/']}>
                <Sidebar />
            </MemoryRouter>
        );
        expect(container.firstChild).toMatchSnapshot();
    });

    it('Sidebar snapshot in dark mode', () => {
        document.documentElement.classList.add('dark');
        const { container } = render(
            <MemoryRouter initialEntries={['/admin/timesheets']}>
                <Sidebar />
            </MemoryRouter>
        );
        expect(container.firstChild).toMatchSnapshot();
    });

    it('WeekHeader snapshot in dark mode', () => {
        document.documentElement.classList.add('dark');
        const { container } = render(
            <WeekHeader
                week={{
                    week_start: '2026-02-10',
                    week_end: '2026-02-16',
                    can_submit: false,
                    week_complete: true,
                    submit_available_at: null,
                }}
                offset={0}
                setOffset={vi.fn()}
                submitWeek={vi.fn()}
                submitting={false}
            />
        );
        expect(container.firstChild).toMatchSnapshot();
    });

    it('DayCard snapshot in light mode (rejected)', () => {
        const { container } = render(
            <DayCard
                day={{
                    date: '2026-02-10',
                    label: 'Mon, Feb 10',
                    status: 'rejected',
                    rejection_reason: 'Fix details',
                    entries: [
                        {
                            id: 10,
                            project_id: 1,
                            project: { name: 'Internal' },
                            description: 'Refactor',
                            duration_minutes: 45,
                        },
                    ],
                }}
                isToday={false}
                locked={false}
                onUpdated={vi.fn()}
            />
        );
        expect(container.firstChild).toMatchSnapshot();
    });

    it('AdminTimesheetsTable snapshot in dark mode', () => {
        document.documentElement.classList.add('dark');
        const { container } = render(
            <MemoryRouter>
                <AdminTimesheetsTable
                    loading={false}
                    timesheets={[
                        {
                            id: 9,
                            user: { name: 'Admin User' },
                            work_date: '2026-02-10',
                            status: 'submitted',
                            submitted_at: '2026-02-10T08:00:00Z',
                            rules: {
                                approve: { allowed: true, message: null },
                                reject: { allowed: true, message: null },
                            },
                        },
                    ]}
                    hasActiveFilters={false}
                    onClearFilters={vi.fn()}
                    selectedIds={[]}
                    bulkLoading={false}
                    onBulkApprove={vi.fn()}
                    onBulkReject={vi.fn()}
                    pagination={{ current_page: 1, last_page: 1, from: 1, to: 1, total: 1 }}
                    allSubmittedSelected={false}
                    onToggleSelectAll={vi.fn()}
                    onToggleSelectOne={vi.fn()}
                    onGoToPage={vi.fn()}
                />
            </MemoryRouter>
        );
        expect(container.firstChild).toMatchSnapshot();
    });
});

