import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from '../Dashboard';

vi.mock('../../context/ProjectContext', () => ({
    useProjects: () => ({
        projects: [{ id: 1, name: 'Internal' }],
        loading: false,
    }),
}));

vi.mock('../../context/ApiContext', () => ({
    useApi: () => ({
        api: vi.fn(async ({ url }) => {
            if (url === '/api/timesheets/today') {
                return {
                    total_minutes: 60,
                    entries: [
                        {
                            id: 1,
                            project: { name: 'Internal' },
                            description: 'UI polish',
                            started_at: '2026-02-10T09:00:00Z',
                            ended_at: '2026-02-10T10:00:00Z',
                            duration_minutes: 60,
                        },
                    ],
                };
            }
            if (url === '/api/time-entries/running') return null;
            return {};
        }),
    }),
}));

describe('Dashboard visual theme snapshot', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-02-16T16:35:00Z'));
    });

    afterEach(() => {
        document.documentElement.classList.remove('dark');
        vi.useRealTimers();
    });

    it('renders in light mode', () => {
        const { container } = render(<Dashboard />);
        expect(screen.getByText('Today')).toBeInTheDocument();
        expect(container.firstChild).toMatchSnapshot();
    });

    it('renders in dark mode', () => {
        document.documentElement.classList.add('dark');
        const { container } = render(<Dashboard />);
        expect(screen.getByText('Today')).toBeInTheDocument();
        expect(container.firstChild).toMatchSnapshot();
    });
});
