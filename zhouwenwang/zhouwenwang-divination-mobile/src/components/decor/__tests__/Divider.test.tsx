import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Divider } from '../Divider';

describe('Divider', () => {
  it('renders without label (pure line)', () => {
    render(<Divider />);
    expect(screen.getByTestId('divider')).toBeInTheDocument();
    expect(screen.queryByTestId('divider-label')).not.toBeInTheDocument();
  });

  it('renders with label when label prop provided', () => {
    render(<Divider label="❖" />);
    expect(screen.getByTestId('divider-label')).toHaveTextContent('❖');
  });

  it('renders empty string label as a label element', () => {
    // 显式 label="" 应与未传 label 区分: 空字符串视为有 label 但空内容
    render(<Divider label="" />);
    expect(screen.getByTestId('divider-label')).toBeInTheDocument();
  });

  it('marks itself decorative via aria-hidden', () => {
    render(<Divider />);
    expect(screen.getByTestId('divider')).toHaveAttribute('aria-hidden', 'true');
  });

  it('reflects label presence via data-has-label', () => {
    const { rerender } = render(<Divider label="text" />);
    expect(screen.getByTestId('divider')).toHaveAttribute('data-has-label', 'true');

    rerender(<Divider />);
    expect(screen.getByTestId('divider')).toHaveAttribute('data-has-label', 'false');
  });

  it('merges custom className onto root element', () => {
    render(<Divider className="my-divider-cls" />);
    expect(screen.getByTestId('divider')).toHaveClass('my-divider-cls');
  });
});
