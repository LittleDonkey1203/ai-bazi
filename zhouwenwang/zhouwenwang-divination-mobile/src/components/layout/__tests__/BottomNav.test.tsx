import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Coins, Grid3X3, Hand, Moon, Calendar, TrendingUp } from 'lucide-react';
import BottomNav from '../BottomNav';

vi.mock('../../common/SettingsModal', () => ({
  SettingsModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="settings-modal">settings</div> : null,
}));

vi.mock('../../../core/store', () => ({
  useUI: () => ({ clearError: vi.fn() }),
}));

const mockGames = vi.hoisted(() => [
  { id: 'liuyao', name: '六爻占卜', path: '/liuyao', icon: undefined, order: 1 },
  { id: 'qimen', name: '奇门遁甲', path: '/qimen', icon: undefined, order: 2 },
  { id: 'palmistry', name: '手相分析', path: '/palmistry', icon: undefined, order: 3 },
  { id: 'zhougong', name: '周公解梦', path: '/zhougong', icon: undefined, order: 4 },
  { id: 'bazi', name: '八字推命', path: '/bazi', icon: undefined, order: 5 },
  { id: 'lifekline', name: '人生K线', path: '/lifekline', icon: undefined, order: 6 },
]);

vi.mock('../../../games', () => ({
  getAllGames: () => mockGames,
}));

beforeEach(() => {
  mockGames[0].icon = Coins as unknown as undefined;
  mockGames[1].icon = Grid3X3 as unknown as undefined;
  mockGames[2].icon = Hand as unknown as undefined;
  mockGames[3].icon = Moon as unknown as undefined;
  mockGames[4].icon = Calendar as unknown as undefined;
  mockGames[5].icon = TrendingUp as unknown as undefined;
});

const RoutePath: React.FC = () => {
  const location = useLocation();
  return <div data-testid="current-path">{location.pathname}</div>;
};

function renderAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <BottomNav />
      <Routes>
        <Route path="*" element={<RoutePath />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('BottomNav', () => {
  it('renders the home item and primary game items', () => {
    renderAt('/');
    const nav = screen.getByRole('navigation', { name: '底部导航' });
    expect(within(nav).getByText('首页')).toBeInTheDocument();
    expect(within(nav).getByText('六爻占卜')).toBeInTheDocument();
    expect(within(nav).getByText('奇门遁甲')).toBeInTheDocument();
    expect(within(nav).getByText('手相分析')).toBeInTheDocument();
  });

  it('marks the active route with aria-current="page"', () => {
    renderAt('/qimen');
    const link = screen.getByRole('link', { name: /奇门遁甲/ });
    expect(link).toHaveAttribute('aria-current', 'page');

    const homeLink = screen.getByRole('link', { name: /首页/ });
    expect(homeLink).not.toHaveAttribute('aria-current');
  });

  it('navigates to a different route when an item is clicked', async () => {
    renderAt('/');
    expect(screen.getByTestId('current-path')).toHaveTextContent('/');

    await userEvent.click(screen.getByRole('link', { name: /六爻占卜/ }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/liuyao');
  });

  it('renders a "更多" button and lets the user open the overflow sheet', async () => {
    renderAt('/');
    const moreButton = screen.getByRole('button', { name: '更多导航' });
    expect(moreButton).toBeInTheDocument();

    await userEvent.click(moreButton);

    const dialog = await screen.findByRole('dialog', { name: '更多导航' });
    expect(within(dialog).getByText('八字推命')).toBeInTheDocument();
    expect(within(dialog).getByText('人生K线')).toBeInTheDocument();
    expect(within(dialog).getByText('设置')).toBeInTheDocument();
  });

  it('navigates to overflow item via the "更多" sheet', async () => {
    renderAt('/');
    await userEvent.click(screen.getByRole('button', { name: '更多导航' }));
    const dialog = await screen.findByRole('dialog', { name: '更多导航' });
    await userEvent.click(within(dialog).getByRole('link', { name: /八字推命/ }));

    expect(screen.getByTestId('current-path')).toHaveTextContent('/bazi');
  });

  it('opens the settings modal when "设置" is clicked in the more sheet', async () => {
    renderAt('/');
    await userEvent.click(screen.getByRole('button', { name: '更多导航' }));
    const dialog = await screen.findByRole('dialog', { name: '更多导航' });
    await userEvent.click(within(dialog).getByRole('button', { name: /设置/ }));

    expect(await screen.findByTestId('settings-modal')).toBeInTheDocument();
  });

  it('highlights the more button when the active route is in the overflow set', () => {
    renderAt('/bazi');
    const moreButton = screen.getByRole('button', { name: '更多导航' });
    expect(moreButton.className).toContain('text-[#FF9900]');
  });
});
