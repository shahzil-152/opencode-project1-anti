import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { userApi } from '@/services/userApi';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'taskflow.theme';

function resolve(theme) {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY) || 'system');

  // Adopt the server-side preference on first visit (no local choice yet).
  useEffect(() => {
    if (user?.preferences?.theme && !localStorage.getItem(STORAGE_KEY)) {
      setTheme(user.preferences.theme);
    }
  }, [user]);

  // Apply the .dark class and follow OS changes while in "system" mode.
  useEffect(() => {
    const apply = () => {
      const dark = resolve(theme) === 'dark';
      document.documentElement.classList.toggle('dark', dark);
    };
    apply();
    if (theme !== 'system') return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  const updateTheme = useCallback((next) => {
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    // Best-effort sync so the preference follows the user across devices.
    userApi.updatePreferences({ theme: next }).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme: resolve(theme), setTheme: updateTheme }),
    [theme, updateTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
