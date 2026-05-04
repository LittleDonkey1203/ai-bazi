import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import BottomNav from './BottomNav';
import { MarqueeNotification, MobileDetector } from '../common';
import { useSettings, useMaster, useUI, useStore } from '../../core/store';
import { fetchMasters, getDefaultMaster } from '../../masters/service';
import { getDefaultServerUrl } from '../../utils/url';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const Layout: React.FC = () => {
  const { settings } = useSettings();
  const { updateSettings } = useStore();
  const { selectedMaster, setSelectedMaster, setAvailableMasters, initializeDefaultMaster } = useMaster();
  const { clearError } = useUI();
  const location = useLocation();
  const { isMobile } = useBreakpoint();

  // 路由变化时清除错误状态
  useEffect(() => {
    clearError();
  }, [location.pathname, clearError]);

  // 初始化设置 - 确保默认serverUrl被保存
  useEffect(() => {
    const initializeSettings = async () => {
      if (!settings.serverUrl) {
        try {
          await updateSettings({ serverUrl: getDefaultServerUrl() });
        } catch (error) {
          console.error('初始化默认设置失败:', error);
        }
      }
    };
    initializeSettings();
  }, []);

  // 初始化大师列表
  useEffect(() => {
    const initializeMasters = async () => {
      try {
        const masters = await fetchMasters();
        setAvailableMasters(masters);

        if (!selectedMaster) {
          const defaultMaster = getDefaultMaster(masters);
          if (defaultMaster) setSelectedMaster(defaultMaster);
        } else {
          const masterExists = masters.find((m) => m.id === selectedMaster.id);
          if (!masterExists) {
            const defaultMaster = getDefaultMaster(masters);
            if (defaultMaster) setSelectedMaster(defaultMaster);
          }
        }

        initializeDefaultMaster();
      } catch (error) {
        console.error('初始化大师列表失败:', error);
      }
    };
    initializeMasters();
  }, []);

  const desktopMarginLeft = settings.sidebarCollapsed ? '80px' : '256px';

  return (
    <div className="bg-night min-h-screen">
      {/* 移动端检测组件 (改造后默认放行) */}
      <MobileDetector />

      {/* 跑马灯通知 - 全局覆盖 */}
      <MarqueeNotification apiBaseUrl={settings.serverUrl} />

      {/* 桌面 / 平板侧边栏 */}
      {!isMobile && <Sidebar />}

      <div
        className="transition-all duration-300 ease-in-out"
        style={{
          marginLeft: isMobile ? '0px' : desktopMarginLeft,
          // G1 fix (known-mobile-issues): BottomNav (h-16 = 64px) + safe-area-inset-bottom 可达 ~98px,
          // 5rem (80px) 不够;改为 calc 让位准确 = nav 高 + 安全区高 + 16px 缓冲。
          paddingBottom: isMobile ? 'calc(5rem + env(safe-area-inset-bottom))' : undefined,
        }}
      >
        <MainContent isCollapsed={settings.sidebarCollapsed} />
      </div>

      {/* 移动端底部导航 */}
      {isMobile && <BottomNav />}
    </div>
  );
};

export default Layout;
