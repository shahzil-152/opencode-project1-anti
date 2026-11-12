import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, Clock, Inbox as InboxIcon, Mail, MessageSquare, UserPlus } from 'lucide-react';
import { Dropdown } from '@/components/ui/Dropdown';
import { useNotifications } from '@/context/NotificationContext';
import { notificationApi } from '@/services/notificationApi';
import { relativeTime } from '@/utils/dates';
import { cn } from '@/utils/cn';

const TYPE_ICONS = {
  assignment: UserPlus,
  comment: MessageSquare,
  completion: CheckCircle2,
  deadline: Clock,
  invitation: Mail,
};

export default function NotificationBell() {
  const { unreadCount, refresh } = useNotifications();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load the latest notifications whenever the menu opens.
  const load = async (isOpen) => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const { data } = await notificationApi.list({ limit: 5 });
      setItems(data);
    } catch {
      /* non-critical */
    } finally {
      setLoading(false);
    }
  };

  // Poll the badge count when the menu is opened and closed.
  useEffect(() => {
    refresh();
  }, [refresh]);

  const openNotification = async (n, close) => {
    close();
    if (!n.read) {
      notificationApi.markRead(n._id).then(() => refresh()).catch(() => {});
    }
    if (n.link?.kind === 'task') navigate(`/app/tasks?task=${n.link.id}`);
    else if (n.link?.kind === 'project') navigate(`/app/projects/${n.link.id}`);
    else navigate('/app/team');
  };

  return (
    <Dropdown
      widthClass="w-80"
      trigger={
        <span className="relative flex h-8 w-8 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-clay-soft hover:text-clay">
          <Bell size={15} />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-clay px-0.5 text-[9px] font-bold leading-none text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </span>
      }
      onOpenChange={load}
    >
      {(close) => (
        <>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-muted">Notifications</span>
            <button
              className="text-[12px] font-medium text-clay hover:underline"
              onClick={() => {
                close();
                navigate('/app/inbox');
              }}
            >
              View all
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto border-t border-line">
            {loading && items.length === 0 && (
              <p className="px-3 py-6 text-center text-[13px] text-muted">Loading…</p>
            )}
            {!loading && items.length === 0 && (
              <p className="flex flex-col items-center gap-2 px-3 py-6 text-center text-[13px] text-muted">
                <InboxIcon size={16} />
                You're all caught up.
              </p>
            )}
            {items.map((n) => {
              const Icon = TYPE_ICONS[n.type] || Bell;
              return (
                <button
                  key={n._id}
                  onClick={() => openNotification(n, close)}
                  className="flex w-full items-start gap-2.5 border-b border-line px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-paper"
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                      n.read ? 'bg-paper-deep text-muted' : 'bg-clay-soft text-clay'
                    )}
                  >
                    <Icon size={12} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate text-[12.5px] leading-snug', n.read ? 'text-ink-soft' : 'font-medium text-ink')}>
                      {n.title}
                    </span>
                    {n.body && <span className="mt-0.5 block truncate text-[11.5px] text-muted">{n.body}</span>}
                    <span className="mt-0.5 block text-[11px] text-muted">{relativeTime(n.createdAt)}</span>
                  </span>
                  {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </Dropdown>
  );
}
