import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MoreHorizontal, Settings as SettingsIcon, X } from 'lucide-react';
import { getAllGames } from '../../games';
import { SettingsModal } from '../common/SettingsModal';
import { useUI } from '../../core/store';

const PRIMARY_VISIBLE_COUNT = 4;

interface BottomNavItem {
  to: string;
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
}

function buildNavItems(): BottomNavItem[] {
  const games = getAllGames();
  const homeItem: BottomNavItem = { to: '/', label: '首页', Icon: Home };
  return [
    homeItem,
    ...games.map((game) => ({
      to: game.path,
      label: game.name,
      Icon: game.icon ?? Home,
    })),
  ];
}

interface NavLinkButtonProps {
  item: BottomNavItem;
  active: boolean;
  onClick?: () => void;
}

const NavLinkButton: React.FC<NavLinkButtonProps> = ({ item, active, onClick }) => {
  const { Icon } = item;
  return (
    <Link
      to={item.to}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 px-2 py-2 min-h-[56px] flex-1 transition-colors ${
        active ? 'text-[#FF9900]' : 'text-[#CCCCCC] hover:text-white'
      }`}
    >
      <Icon size={22} />
      <span className="text-[11px] leading-none">{item.label}</span>
    </Link>
  );
};

interface MoreSheetProps {
  open: boolean;
  onClose: () => void;
  items: BottomNavItem[];
  activePath: string;
  onOpenSettings: () => void;
}

const MoreSheet: React.FC<MoreSheetProps> = ({ open, onClose, items, activePath, onOpenSettings }) => {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-label="更多导航"
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm md:hidden"
      onClick={onClose}
    >
      <div
        className="bg-night-2 border-t border-[#333333] rounded-t-2xl p-4"
        onClick={(event) => event.stopPropagation()}
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white text-base font-medium">更多</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="p-2 rounded-lg text-[#CCCCCC] hover:bg-[#222222] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <ul className="grid grid-cols-3 gap-2">
          {items.map((item) => {
            const { Icon } = item;
            const active = activePath === item.to;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  aria-current={active ? 'page' : undefined}
                  onClick={onClose}
                  className={`flex flex-col items-center justify-center gap-2 py-3 rounded-xl border ${
                    active
                      ? 'border-[#FF9900] text-[#FF9900] bg-[#FF9900]/10'
                      : 'border-[#333333] text-[#CCCCCC] hover:text-white hover:bg-[#1a1a1a]'
                  }`}
                >
                  <Icon size={22} />
                  <span className="text-xs">{item.label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="w-full flex flex-col items-center justify-center gap-2 py-3 rounded-xl border border-[#333333] text-[#CCCCCC] hover:text-white hover:bg-[#1a1a1a]"
            >
              <SettingsIcon size={22} />
              <span className="text-xs">设置</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export interface BottomNavProps {
  className?: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ className = '' }) => {
  const location = useLocation();
  const { clearError } = useUI();
  const [moreOpen, setMoreOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const allItems = useMemo(buildNavItems, []);
  const needsMore = allItems.length > PRIMARY_VISIBLE_COUNT + 1;
  const primaryItems = needsMore ? allItems.slice(0, PRIMARY_VISIBLE_COUNT) : allItems;
  const overflowItems = needsMore ? allItems.slice(PRIMARY_VISIBLE_COUNT) : [];

  const isOverflowActive = overflowItems.some((item) => item.to === location.pathname);

  return (
    <>
      <nav
        role="navigation"
        aria-label="底部导航"
        data-testid="bottom-nav"
        className={`fixed bottom-0 left-0 right-0 z-40 bg-night border-t border-[#333333] md:hidden ${className}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="flex items-stretch justify-around h-16">
          {primaryItems.map((item) => (
            <li key={item.to} className="flex-1 flex">
              <NavLinkButton
                item={item}
                active={location.pathname === item.to}
                onClick={clearError}
              />
            </li>
          ))}
          {needsMore && (
            <li className="flex-1 flex">
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                aria-label="更多导航"
                aria-haspopup="dialog"
                aria-expanded={moreOpen}
                className={`flex flex-col items-center justify-center gap-1 px-2 py-2 min-h-[56px] flex-1 transition-colors ${
                  isOverflowActive ? 'text-[#FF9900]' : 'text-[#CCCCCC] hover:text-white'
                }`}
              >
                <MoreHorizontal size={22} />
                <span className="text-[11px] leading-none">更多</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        items={overflowItems}
        activePath={location.pathname}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};

export default BottomNav;
