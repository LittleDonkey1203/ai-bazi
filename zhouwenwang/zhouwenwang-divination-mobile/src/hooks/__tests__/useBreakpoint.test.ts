import { describe, expect, it, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useBreakpoint } from '../useBreakpoint';
import { setViewportWidth } from '../../test/setup';

describe('useBreakpoint', () => {
  beforeEach(() => {
    setViewportWidth(1280);
  });

  it('returns mobile state when viewport width is below 768px', () => {
    setViewportWidth(600);
    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.breakpoint).toBe('mobile');
  });

  it('returns tablet state when viewport width is between 768 and 1023px', () => {
    setViewportWidth(900);
    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.breakpoint).toBe('tablet');
  });

  it('returns desktop state when viewport width is 1024px or larger', () => {
    setViewportWidth(1280);
    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.breakpoint).toBe('desktop');
  });

  it('updates state when viewport changes from desktop to mobile', () => {
    setViewportWidth(1280);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.breakpoint).toBe('desktop');

    act(() => {
      setViewportWidth(500);
    });

    expect(result.current.isMobile).toBe(true);
    expect(result.current.breakpoint).toBe('mobile');
  });

  it('treats exact 768px as tablet (boundary)', () => {
    setViewportWidth(768);
    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
  });

  it('treats exact 1024px as desktop (boundary)', () => {
    setViewportWidth(1024);
    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.isDesktop).toBe(true);
  });
});
