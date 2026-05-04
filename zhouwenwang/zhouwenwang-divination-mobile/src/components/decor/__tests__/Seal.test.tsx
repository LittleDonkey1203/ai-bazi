import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Seal } from '../Seal';

describe('Seal', () => {
  it('renders the given character', () => {
    render(<Seal char="文" />);
    expect(screen.getByTestId('seal')).toHaveTextContent('文');
  });

  it('marks itself decorative via aria-hidden', () => {
    render(<Seal char="文" />);
    expect(screen.getByTestId('seal')).toHaveAttribute('aria-hidden', 'true');
  });

  it('reflects active state via data-active', () => {
    const { rerender } = render(<Seal char="文" active />);
    expect(screen.getByTestId('seal')).toHaveAttribute('data-active', 'true');

    rerender(<Seal char="文" />);
    expect(screen.getByTestId('seal')).toHaveAttribute('data-active', 'false');
  });

  it('reflects size variant via data-size (sm / md / lg)', () => {
    const { rerender } = render(<Seal char="A" size="sm" />);
    expect(screen.getByTestId('seal')).toHaveAttribute('data-size', 'sm');

    rerender(<Seal char="A" size="md" />);
    expect(screen.getByTestId('seal')).toHaveAttribute('data-size', 'md');

    rerender(<Seal char="A" size="lg" />);
    expect(screen.getByTestId('seal')).toHaveAttribute('data-size', 'lg');
  });

  it('defaults to size="md" when size prop omitted', () => {
    render(<Seal char="X" />);
    expect(screen.getByTestId('seal')).toHaveAttribute('data-size', 'md');
  });

  it('merges custom className onto root element', () => {
    render(<Seal char="文" className="my-custom-cls" />);
    expect(screen.getByTestId('seal')).toHaveClass('my-custom-cls');
  });
});
