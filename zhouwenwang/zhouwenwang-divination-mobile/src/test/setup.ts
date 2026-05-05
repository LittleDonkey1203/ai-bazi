import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

type MatchMediaListener = (event: MediaQueryListEvent) => void;

interface MutableMediaQueryList {
  matches: boolean;
  media: string;
  onchange: ((event: MediaQueryListEvent) => void) | null;
  addListener: (listener: MatchMediaListener) => void;
  removeListener: (listener: MatchMediaListener) => void;
  addEventListener: (type: 'change', listener: MatchMediaListener) => void;
  removeEventListener: (type: 'change', listener: MatchMediaListener) => void;
  dispatchEvent: (event: Event) => boolean;
}

const matchMediaRegistry = new Map<string, Set<MatchMediaListener>>();

function createMatchMedia(width: number) {
  return (query: string): MutableMediaQueryList => {
    const matches = evaluateQuery(query, width);
    const listeners = matchMediaRegistry.get(query) ?? new Set<MatchMediaListener>();
    matchMediaRegistry.set(query, listeners);

    return {
      matches,
      media: query,
      onchange: null,
      addListener: (listener) => listeners.add(listener),
      removeListener: (listener) => listeners.delete(listener),
      addEventListener: (_type, listener) => listeners.add(listener),
      removeEventListener: (_type, listener) => listeners.delete(listener),
      dispatchEvent: () => true,
    };
  };
}

function evaluateQuery(query: string, width: number): boolean {
  const maxMatch = query.match(/max-width:\s*(\d+)px/);
  if (maxMatch) return width <= Number(maxMatch[1]);
  const minMatch = query.match(/min-width:\s*(\d+)px/);
  if (minMatch) return width >= Number(minMatch[1]);
  return false;
}

export function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
  window.matchMedia = createMatchMedia(width) as unknown as typeof window.matchMedia;
  matchMediaRegistry.forEach((listeners, query) => {
    const matches = evaluateQuery(query, width);
    listeners.forEach((listener) => {
      listener({ matches, media: query } as MediaQueryListEvent);
    });
  });
}

setViewportWidth(1280);

class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

if (!('ResizeObserver' in window)) {
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: ResizeObserverMock,
  });
}
