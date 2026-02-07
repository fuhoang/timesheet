import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../StatusBadge';

describe('StatusBadge', () => {
    it('renders label', () => {
        render(<StatusBadge status="approved" />);
        expect(screen.getByText('approved')).toBeInTheDocument();
    });

    it('applies approved styles', () => {
        render(<StatusBadge status="approved" />);
        const el = screen.getByText('approved');
        expect(el.className).toContain('bg-green-100');
    });
});
