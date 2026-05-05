import { useEffect, useState } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: Breakpoint;
}

export const MOBILE_MAX_WIDTH = 767;
export const DESKTOP_MIN_WIDTH = 1024;

const MOBILE_QUERY = `(max-width: ${MOBILE_MAX_WIDTH}px)`;
const DESKTOP_QUERY = `(min-width: ${DESKTOP_MIN_WIDTH}px)`;

function readState(): BreakpointState {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      breakpoint: 'desktop',
    };
  }

  const isMobile = window.matchMedia(MOBILE_QUERY).matches;
  const isDesktop = !isMobile && window.matchMedia(DESKTOP_QUERY).matches;
  const isTablet = !isMobile && !isDesktop;

  return {
    isMobile,
    isTablet,
    isDesktop,
    breakpoint: isMobile ? 'mobile' : isDesktop ? 'desktop' : 'tablet',
  };
}

export function useBreakpoint(): BreakpointState {
  const [state, setState] = useState<BreakpointState>(() => readState());

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const update = () => setState(readState());
    const mobileMql = window.matchMedia(MOBILE_QUERY);
    const desktopMql = window.matchMedia(DESKTOP_QUERY);

    mobileMql.addEventListener('change', update);
    desktopMql.addEventListener('change', update);
    update();

    return () => {
      mobileMql.removeEventListener('change', update);
      desktopMql.removeEventListener('change', update);
    };
  }, []);

  return state;
}
