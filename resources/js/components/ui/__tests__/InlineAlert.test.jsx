import { render, screen } from '@testing-library/react';
import InlineAlert from '../InlineAlert';

describe('InlineAlert', () => {
    it('renders content', () => {
        render(<InlineAlert>Problem</InlineAlert>);
        expect(screen.getByText('Problem')).toBeInTheDocument();
    });

    it('uses error styles by default', () => {
        render(<InlineAlert>Problem</InlineAlert>);
        const el = screen.getByText('Problem');
        expect(el.className).toContain('bg-red-50');
    });

    it('supports info variant', () => {
        render(<InlineAlert type="info">Info</InlineAlert>);
        const el = screen.getByText('Info');
        expect(el.className).toContain('bg-blue-50');
    });
});
