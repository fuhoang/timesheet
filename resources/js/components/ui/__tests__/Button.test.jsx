import { render, screen } from '@testing-library/react';
import Button from '../Button';

describe('Button', () => {
    it('renders children', () => {
        render(<Button>Click</Button>);
        expect(screen.getByText('Click')).toBeInTheDocument();
    });

    it('applies primary styles by default', () => {
        render(<Button>Click</Button>);
        const el = screen.getByText('Click');
        expect(el.className).toContain('bg-blue-600');
    });

    it('applies danger variant', () => {
        render(<Button variant="danger">Delete</Button>);
        const el = screen.getByText('Delete');
        expect(el.className).toContain('bg-red-600');
    });
});
