import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GuaWatermark } from '../GuaWatermark';

describe('GuaWatermark', () => {
  it('renders the given symbol', () => {
    render(<GuaWatermark symbol="☰" />);
    expect(screen.getByTestId('gua-watermark')).toHaveTextContent('☰');
  });

  it('marks itself decorative via aria-hidden', () => {
    render(<GuaWatermark symbol="☵" />);
    expect(screen.getByTestId('gua-watermark')).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies default opacity 0.06', () => {
    render(<GuaWatermark symbol="☷" />);
    expect(screen.getByTestId('gua-watermark')).toHaveStyle({ opacity: '0.06' });
  });

  it('applies custom opacity when provided', () => {
    render(<GuaWatermark symbol="☷" opacity={0.12} />);
    expect(screen.getByTestId('gua-watermark')).toHaveStyle({ opacity: '0.12' });
  });

  it('disables pointer events for non-interactivity', () => {
    render(<GuaWatermark symbol="☵" />);
    expect(screen.getByTestId('gua-watermark')).toHaveStyle({ pointerEvents: 'none' });
  });

  it('disables user-select to prevent accidental selection', () => {
    render(<GuaWatermark symbol="☴" />);
    expect(screen.getByTestId('gua-watermark')).toHaveStyle({ userSelect: 'none' });
  });

  it('positions absolutely (requires positioned parent)', () => {
    render(<GuaWatermark symbol="☱" />);
    expect(screen.getByTestId('gua-watermark')).toHaveStyle({ position: 'absolute' });
  });

  it('merges custom className onto root element', () => {
    render(<GuaWatermark symbol="☷" className="my-watermark-cls" />);
    expect(screen.getByTestId('gua-watermark')).toHaveClass('my-watermark-cls');
  });
});
