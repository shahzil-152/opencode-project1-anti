import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Tiny cache-invalidation bus. Mutating components bump a resource version
 * ("tasks", "projects", ...), and pages re-fetch when their version changes.
 * This avoids prop-drilling refresh callbacks through the whole tree.
 */
const RefreshContext = createContext(null);

const RESOURCES = ['tasks', 'projects', 'notifications', 'activity', 'members', 'dashboard'];

export function RefreshProvider({ children }) {
  const [versions, setVersions] = useState(() =>
    Object.fromEntries(RESOURCES.map((key) => [key, 0]))
  );

  const bump = useCallback((...keys) => {
    setVersions((prev) => {
      const next = { ...prev };
      for (const key of keys) {
        if (key in next) next[key] = prev[key] + 1;
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ versions, bump }), [versions, bump]);

  return <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>;
}

export function useRefresh() {
  const ctx = useContext(RefreshContext);
  if (!ctx) throw new Error('useRefresh must be used inside RefreshProvider');
  return ctx;
}
