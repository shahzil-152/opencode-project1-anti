import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, Plus, Search } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Dropdown, MenuDivider, MenuItem } from '@/components/ui/Dropdown';
import NotificationBell from './NotificationBell';
import SearchPalette from './SearchPalette';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const TITLES = [
  [/^\/app\/dashboard$/, 'Overview'],
  [/^\/app\/tasks$/, 'My Tasks'],
  [/^\/app\/inbox$/, 'Inbox'],
  [/^\/app\/projects\/.+/, 'Project'],
  [/^\/app\/projects$/, 'Projects'],
  [/^\/app\/calendar$/, 'Calendar'],
  [/^\/app\/team$/, 'Team'],
  [/^\/app\/settings$/, 'Settings'],
];

function titleFor(pathname) {
  for (const [pattern, title] of TITLES) {
    if (pattern.test(pathname)) return title;
  }
  return 'TaskFlow';
}

export default function Topbar({ onMenuClick, onNewTask }) {
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-paper px-3 sm:px-4">
      <button
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-clay-soft hover:text-clay md:hidden"
      >
        <Menu size={17} />
      </button>

      <h1 className="min-w-0 truncate text-[15px] font-semibold text-ink">{titleFor(pathname)}</h1>

      <div className="flex-1" />

      <SearchPalette>
        <button
          className="hidden h-8 w-64 items-center gap-2 rounded-md border border-line bg-card px-2.5 text-[13px] text-muted transition-colors hover:border-line-strong sm:flex"
          title="Search (Ctrl+K)"
        >
          <Search size={13} />
          <span className="flex-1 text-left">Search tasks, projects, people…</span>
          <kbd className="rounded border border-line bg-paper px-1 font-sans text-[10px] text-muted">⌘K</kbd>
        </button>
        <button
          aria-label="Search"
          className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-clay-soft hover:text-clay sm:hidden"
        >
          <Search size={15} />
        </button>
      </SearchPalette>

      <Button variant="primary" size="sm" onClick={onNewTask}>
        <Plus size={14} />
        <span className="hidden sm:inline">New task</span>
      </Button>

      <NotificationBell />

      <Dropdown
        trigger={
          <span className="flex items-center rounded-full p-0.5 transition-transform hover:scale-105">
            <Avatar user={user} size="md" />
          </span>
        }
      >
        {(close) => (
          <>
            <MenuItem
              onClick={() => {
                close();
                navigate('/app/settings');
              }}
            >
              Profile settings
            </MenuItem>
            <MenuItem
              onClick={() => {
                close();
                setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
              }}
            >
              Switch to {resolvedTheme === 'dark' ? 'light' : 'dark'} mode
            </MenuItem>
            <MenuDivider />
            <MenuItem
              danger
              onClick={() => {
                close();
                logout();
              }}
            >
              Sign out
            </MenuItem>
          </>
        )}
      </Dropdown>
    </header>
  );
}
