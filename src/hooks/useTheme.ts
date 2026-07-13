'use client';

import { useCallback, useEffect, useState } from 'react';

const THEME_KEY = 'buddyscript-theme';
const DENSITY_KEY = 'buddyscript-density';
const CHANGE_EVENT = 'buddyscript-appearance-change';

/** Local-first appearance state (instant, no network round-trip) that both
 * AppShell's quick-toggle button and the Settings > Appearance tab read
 * from and write to. Settings additionally persists the choice to the
 * User row so it survives across devices; this hook is just the shared
 * client-side source of truth so the two surfaces never disagree. */
export function useTheme() {
  const [dark, setDarkState] = useState(false);
  const [compact, setCompactState] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDarkState(localStorage.getItem(THEME_KEY) === 'dark');
    setCompactState(localStorage.getItem(DENSITY_KEY) === 'compact');
    const handler = () => {
      setDarkState(localStorage.getItem(THEME_KEY) === 'dark');
      setCompactState(localStorage.getItem(DENSITY_KEY) === 'compact');
    };
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  }, []);

  const setDark = useCallback((value: boolean) => {
    localStorage.setItem(THEME_KEY, value ? 'dark' : 'light');
    setDarkState(value);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const setCompact = useCallback((value: boolean) => {
    localStorage.setItem(DENSITY_KEY, value ? 'compact' : 'comfortable');
    setCompactState(value);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { dark: mounted ? dark : false, compact: mounted ? compact : false, setDark, setCompact, mounted };
}
