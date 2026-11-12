import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '@/services/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Restore the session from the HTTP-only cookie after a page refresh.
  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then(({ user: current }) => {
        if (!cancelled && current) setUser(current);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });

    // The axios interceptor fires this when any API call gets a 401.
    const onUnauthorized = () => setUser(null);
    window.addEventListener('taskflow:unauthorized', onUnauthorized);
    return () => {
      cancelled = true;
      window.removeEventListener('taskflow:unauthorized', onUnauthorized);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { user: loggedIn } = await authApi.login({ email, password });
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const register = useCallback(async (data) => {
    const { user: created } = await authApi.register(data);
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, initializing, login, register, logout, setUser }),
    [user, initializing, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
