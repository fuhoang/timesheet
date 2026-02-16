import React from 'react';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import ReportsFilters from '../ReportsFilters';
import ReportsRow from '../ReportsRow';

function noop() {}

const filterProps = {
    startDate: '2026-02-10',
    endDate: '2026-02-16',
    status: '',
    includeDrafts: false,
    projectId: '',
    userId: '',
    sort: 'total_minutes',
    direction: 'desc',
    perPage: 10,
    projects: [{ id: 1, name: 'Internal' }],
    users: [{ id: 1, name: 'Admin User', email: 'admin@test.com' }],
    totalRows: 1,
    presetName: '',
    presets: [],
    onStartDateChange: noop,
    onEndDateChange: noop,
    onStatusChange: noop,
    onIncludeDraftsChange: noop,
    onProjectChange: noop,
    onUserChange: noop,
    onSortChange: noop,
    onDirectionChange: noop,
    onPerPageChange: noop,
    onPresetNameChange: noop,
    onPresetSelect: noop,
    onPresetSave: noop,
    onPresetRemove: noop,
    onApplyDatePreset: noop,
    onResetFilters: noop,
};

const row = {
    user: { id: 1, name: 'Admin User', email: 'admin@test.com' },
    total_minutes: 120,
    projects: [{ id: 1, name: 'Internal', total_minutes: 120 }],
    days: [
        { date: '2026-02-10', status: 'draft', total_minutes: 30 },
        { date: '2026-02-11', status: 'submitted', total_minutes: 20 },
        { date: '2026-02-12', status: 'approved', total_minutes: 40 },
        { date: '2026-02-13', status: 'rejected', total_minutes: 30 },
    ],
};

describe('Reports visual theme regression', () => {
    afterEach(() => {
        document.documentElement.classList.remove('dark');
    });

    test('filters snapshot in light mode', () => {
        const { container } = render(<ReportsFilters {...filterProps} />);
        expect(container.firstChild).toMatchSnapshot();
    });

    test('filters snapshot in dark mode', () => {
        document.documentElement.classList.add('dark');
        const { container } = render(<ReportsFilters {...filterProps} />);
        expect(container.firstChild).toMatchSnapshot();
    });

    test('row snapshot in light mode', () => {
        const { container } = render(
            <ReportsRow
                row={row}
                formatMinutes={minutes => `${minutes}m`}
                formatHours={minutes => `${(minutes / 60).toFixed(2)}h`}
            />
        );
        expect(container.firstChild).toMatchSnapshot();
    });

    test('row snapshot in dark mode', () => {
        document.documentElement.classList.add('dark');
        const { container } = render(
            <ReportsRow
                row={row}
                formatMinutes={minutes => `${minutes}m`}
                formatHours={minutes => `${(minutes / 60).toFixed(2)}h`}
            />
        );
        expect(container.firstChild).toMatchSnapshot();
    });
});
