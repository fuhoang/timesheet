import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ConfirmActionModal from '../ConfirmActionModal';

describe('ConfirmActionModal keyboard smoke', () => {
    it('closes on Escape key', () => {
        const onClose = vi.fn();
        const { container } = render(
            <ConfirmActionModal
                open
                title="Confirm"
                message="Proceed?"
                onClose={onClose}
                onConfirm={vi.fn()}
            />
        );

        fireEvent.keyDown(container.firstChild, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('submits on Enter key', () => {
        const onConfirm = vi.fn();
        const { container } = render(
            <ConfirmActionModal
                open
                title="Confirm"
                message="Proceed?"
                onClose={vi.fn()}
                onConfirm={onConfirm}
            />
        );

        fireEvent.keyDown(container.firstChild, { key: 'Enter' });
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('requires reason and supports Ctrl+Enter from textarea', () => {
        const onConfirm = vi.fn();
        render(
            <ConfirmActionModal
                open
                title="Reject"
                requireReason
                onClose={vi.fn()}
                onConfirm={onConfirm}
            />
        );

        const textarea = screen.getByPlaceholderText('Enter reason...');
        fireEvent.change(textarea, { target: { value: 'Needs update' } });
        fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

        expect(onConfirm).toHaveBeenCalledWith('Needs update');
    });
});
