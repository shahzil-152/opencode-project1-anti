import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Check,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  ListTodo,
  Plus,
  Settings,
  Users,
  ChevronsUpDown,
  LogOut,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import {
  Dropdown,
  MenuDivider,
  MenuItem,
  MenuLabel,
} from '@/components/ui/Dropdown';
import CreateWorkspaceModal from '@/components/CreateWorkspaceModal';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/utils/cn';

const NAV_ITEMS = [
  { to: '/app/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/app/tasks', label: 'My Tasks', icon: ListTodo },
  { to: '/app/inbox', label: 'Inbox', icon: Inbox, badge: 'unread' },
  { to: '/app/projects', label: 'Projects', icon: FolderKanban },
  { to: '/app/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/app/team', label: 'Team', icon: Users },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ onNewTask }) {
  const { user, logout } = useAuth();
  const { current, workspaces, switchWorkspace, refreshWorkspaces } = useWorkspace();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-14 shrink-0 items-center px-4">
        <Logo />
      </div>

      {/* Workspace switcher */}
      <div className="px-3 pb-2">
        <Dropdown
          align="left"
          widthClass="w-56"
          trigger={
            <span className="flex w-full items-center gap-2 rounded-md border border-line bg-card px-2 py-1.5 text-left transition-colors hover:border-line-strong">
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] text-[10px] font-bold text-white"
                style={{ backgroundColor: 'var(--clay)' }}
              >
                {(current?.name || 'W').slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                {current?.name || 'No workspace'}
              </span>
              <ChevronsUpDown size={13} className="shrink-0 text-muted" />
            </span>
          }
        >
          {(close) => (
            <>
              <MenuLabel>Workspaces</MenuLabel>
              {workspaces.map((ws) => (
                <MenuItem
                  key={ws._id}
                  icon={ws._id === current?._id ? Check : null}
                  onClick={() => {
                    if (ws._id !== current?._id) switchWorkspace(ws._id);
                    close();
                  }}
                >
                  {ws.name}
                </MenuItem>
              ))}
              <MenuDivider />
              <MenuItem
                icon={Plus}
                onClick={() => {
                  close();
                  setCreateOpen(true);
                }}
              >
                New workspace
              </MenuItem>
            </>
          )}
        </Dropdown>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                isActive ? 'bg-clay-soft text-clay' : 'text-ink-soft hover:bg-card hover:text-ink'
              )
            }
          >
            <item.icon size={15} className="shrink-0" aria-hidden="true" />
            <span className="flex-1">{item.label}</span>
            {item.badge === 'unread' && unreadCount > 0 && (
              <span className="rounded-full bg-clay px-1.5 py-px text-[10.5px] font-semibold leading-4 text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Quick create */}
      <div className="px-3 pb-3">
        <Button variant="secondary" size="sm" className="w-full justify-start" onClick={onNewTask}>
          <Plus size={14} />
          New task
        </Button>
      </div>

      {/* User footer */}
      <div className="border-t border-line px-3 py-2.5">
        <Dropdown
          align="left"
          widthClass="w-52"
          trigger={
            <span className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-card">
              <Avatar user={user} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-ink">{user?.name}</span>
                <span className="block truncate text-[11.5px] text-muted">{user?.email}</span>
              </span>
            </span>
          }
        >
          {(close) => (
            <>
              <MenuItem
                icon={Settings}
                onClick={() => {
                  close();
                  navigate('/app/settings');
                }}
              >
                Settings
              </MenuItem>
              <MenuDivider />
              <MenuItem
                icon={LogOut}
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
      </div>

      <CreateWorkspaceModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(ws) => {
          refreshWorkspaces();
          switchWorkspace(ws._id);
        }}
      />
    </div>
  );
}
