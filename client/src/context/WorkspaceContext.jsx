import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { workspaceApi } from '@/services/workspaceApi';

const WorkspaceContext = createContext(null);
const STORAGE_KEY = 'taskflow.workspace';

export function WorkspaceProvider({ children }) {
  const { user, initializing } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentId, setCurrentId] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [members, setMembers] = useState([]);
  const currentIdRef = useRef(currentId);
  currentIdRef.current = currentId;

  const refreshWorkspaces = useCallback(async () => {
    const list = await workspaceApi.list();
    setWorkspaces(list);
    // Fall back to the first workspace if the stored id is stale/missing.
    if (!list.some((w) => w._id === currentIdRef.current)) {
      const next = list[0]?._id || null;
      setCurrentId(next);
      if (next) localStorage.setItem(STORAGE_KEY, next);
      else localStorage.removeItem(STORAGE_KEY);
    }
    return list;
  }, []);

  // Load workspaces once the session is known.
  useEffect(() => {
    if (initializing) return undefined;
    if (!user) {
      setWorkspaces([]);
      setMembers([]);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    workspaceApi
      .list()
      .then((list) => {
        if (cancelled) return;
        setWorkspaces(list);
        if (!list.some((w) => w._id === currentIdRef.current)) {
          const next = list[0]?._id || null;
          setCurrentId(next);
          if (next) localStorage.setItem(STORAGE_KEY, next);
          else localStorage.removeItem(STORAGE_KEY);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, initializing]);

  const current = useMemo(
    () => workspaces.find((w) => w._id === currentId) || null,
    [workspaces, currentId]
  );

  const switchWorkspace = useCallback((id) => {
    setCurrentId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  // Members of the active workspace (used for assignee filters, selects, team page).
  const refreshMembers = useCallback(async () => {
    if (!currentId) return [];
    try {
      const list = await workspaceApi.members(currentId);
      setMembers(list);
      return list;
    } catch {
      return [];
    }
  }, [currentId]);

  useEffect(() => {
    if (!currentId) {
      setMembers([]);
      return undefined;
    }
    let cancelled = false;
    workspaceApi
      .members(currentId)
      .then((list) => {
        if (!cancelled) setMembers(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [currentId]);

  const role = current?.role || 'member';
  const canManage = role === 'admin' || role === 'owner';

  const value = useMemo(
    () => ({
      workspaces,
      current,
      currentId,
      switchWorkspace,
      loading,
      members,
      refreshMembers,
      refreshWorkspaces,
      role,
      canManage,
    }),
    [workspaces, current, currentId, switchWorkspace, loading, members, refreshMembers, refreshWorkspaces, role, canManage]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
}
