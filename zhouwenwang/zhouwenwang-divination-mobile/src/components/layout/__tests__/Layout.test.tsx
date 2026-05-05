import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const breakpointState = vi.hoisted(() => ({
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  breakpoint: 'desktop' as 'mobile' | 'tablet' | 'desktop',
}));

vi.mock('../../../hooks/useBreakpoint', () => ({
  useBreakpoint: () => breakpointState,
}));

vi.mock('../Sidebar', () => ({
  default: () => <aside data-testid="sidebar">sidebar</aside>,
}));

vi.mock('../BottomNav', () => ({
  default: () => <nav data-testid="bottom-nav-mock">bottom-nav</nav>,
}));

vi.mock('../MainContent', () => ({
  default: () => <main data-testid="main-content">content</main>,
}));

vi.mock('../../common', () => ({
  MarqueeNotification: () => null,
  MobileDetector: () => null,
}));

vi.mock('../../../masters/service', () => ({
  fetchMasters: vi.fn().mockResolvedValue([]),
  getDefaultMaster: () => null,
}));

vi.mock('../../../utils/url', () => ({
  getDefaultServerUrl: () => 'http://localhost',
}));

const settingsState = vi.hoisted(() => ({
  serverUrl: 'http://localhost',
  sidebarCollapsed: false,
}));

vi.mock('../../../core/store', () => ({
  useSettings: () => ({ settings: settingsState, toggleSidebar: vi.fn() }),
  useStore: () => ({ updateSettings: vi.fn() }),
  useMaster: () => ({
    selectedMaster: null,
    setSelectedMaster: vi.fn(),
    setAvailableMasters: vi.fn(),
    initializeDefaultMaster: vi.fn(),
  }),
  useUI: () => ({ clearError: vi.fn() }),
}));

import Layout from '../Layout';

function setBreakpoint(state: 'mobile' | 'tablet' | 'desktop') {
  breakpointState.isMobile = state === 'mobile';
  breakpointState.isTablet = state === 'tablet';
  breakpointState.isDesktop = state === 'desktop';
  breakpointState.breakpoint = state;
}

beforeEach(() => {
  setBreakpoint('desktop');
});

describe('Layout responsive shell', () => {
  it('renders the sidebar and hides the bottom nav on desktop', () => {
    setBreakpoint('desktop');

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.queryByTestId('bottom-nav-mock')).not.toBeInTheDocument();
  });

  it('renders the bottom nav and hides the sidebar on mobile', () => {
    setBreakpoint('mobile');

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('bottom-nav-mock')).toBeInTheDocument();
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
  });

  it('keeps the sidebar on tablet breakpoint', () => {
    setBreakpoint('tablet');

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.queryByTestId('bottom-nav-mock')).not.toBeInTheDocument();
  });
});
