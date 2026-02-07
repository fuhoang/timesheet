import { render, screen } from '@testing-library/react';
import Toast from '../Toast';

describe('Toast', () => {
    it('renders message', () => {
        render(<Toast message="Saved" />);
        expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    it('uses success styles by default', () => {
        render(<Toast message="Saved" />);
        const el = screen.getByText('Saved');
        expect(el.className).toContain('bg-green-600');
    });

    it('uses error styles when type=error', () => {
        render(<Toast message="Failed" type="error" />);
        const el = screen.getByText('Failed');
        expect(el.className).toContain('bg-red-600');
    });
});
