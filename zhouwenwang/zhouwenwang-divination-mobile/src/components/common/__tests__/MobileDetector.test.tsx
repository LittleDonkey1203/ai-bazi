import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import MobileDetector from '../MobileDetector';

describe('MobileDetector (disabled in mobile-friendly build)', () => {
  it('renders nothing and does not show the desktop-recommendation modal', () => {
    const { container } = render(<MobileDetector />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('获得最佳体验')).not.toBeInTheDocument();
    expect(screen.queryByText('继续使用手机版')).not.toBeInTheDocument();
  });
});
