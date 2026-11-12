import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Bell,
  CheckCheck,
  ChevronRight,
  CircleDot,
  MessageSquare,
  UserPlus,
  AlarmClock,
} from 'lucide-react';
import { notificationApi } from '@/services/notificationApi';
import { getError } from '@/services/api';
import { useNotifications } from '@/context/NotificationContext';
import { Button } from '@/components/ui/Button';
import { EmptyState, Skeleton } from '@/components/ui/Feedback';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { relativeTime } from '@/utils/dates';
import { cn } from '@/utils/cn';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
];

const TYPE_META = {
  assignment: { icon: UserPlus, label: 'Assignment', color: 'var(--clay)' },
  comment: { icon: MessageSquare, label: 'Comment', color: 'var(--status-progress)' },
  status: { icon: CircleDot, label: 'Update', color: 'var(--status-review)' },
  deadline: { icon: AlarmClock, label: 'Deadline', color: 'var(--priority-urgent)' },
};

/**
 * Inbox: assignment / comment / status / deadline notifications.
 * Clicking one marks it read and deep-links to the task.
 */
export default function Inbox() {
  const navigate = useNavigate();
  const { refresh } = useNotifications();
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(
    async (targetPage = 1, append = false) => {
      setLoading(!append);
      try {
        const result = await notificationApi.list({
          page: targetPage,
          limit: 25,
          unread: filter === 'unread' ? 'true' : undefined,
        });
        setNotifications((prev) => (append ? [...prev, ...result.data] : result.data));
        setHasMore(Boolean(result.pagination?.hasMore));
        setPage(targetPage);
      } catch (err) {
        toast.error(getError(err).message);
      } finally {
        setLoading(false);
      }
    },
    [filter]
  );

  // Fetch on mount + whenever the filter flips. Opening the inbox also runs
  // the server-side deadline sweep (GET /notifications does that).
  useEffect(() => {
    load(1);
  }, [load]);

  const open = async (notification) => {
    if (!notification.read) {
      try {
        await notificationApi.markRead(notification._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
        );
        refresh();
      } catch {
        // Non-fatal - still navigate.
      }
    }
    if (notification.link?.kind === 'task' && notification.link?.id) {
      navigate(`/app/tasks?task=${notification.link.id}`);
    }
  };

  const markAll = async () => {
    setMarkingAll(true);
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      refresh();
      toast.success('All caught up');
    } catch (err) {
      toast.error(getError(err).message);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadHere = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[17px] font-semibold tracking-tight text-ink">Inbox</h1>
          <p className="mt-0.5 text-[13px] text-muted">
            Mentions, assignments and deadlines for you.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} />
          {unreadHere > 0 && (
            <Button variant="secondary" size="sm" onClick={markAll} loading={markingAll}>
              <CheckCheck size={13} />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="overflow-hidden rounded-lg border border-line bg-card">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-2/5" />
                <Skeleton className="h-2.5 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filter === 'unread' ? 'No unread notifications' : 'Your inbox is empty'}
          description={
            filter === 'unread'
              ? 'You are all caught up. New mentions will land here.'
              : 'Assignments, comments and deadline reminders will show up here.'
          }
        />
      ) : (
        <ul className="overflow-hidden rounded-lg border border-line bg-card">
          {notifications.map((notification) => {
            const meta = TYPE_META[notification.type] || TYPE_META.status;
            const Icon = meta.icon;
            return (
              <li key={notification._id}>
                <button
                  onClick={() => open(notification)}
                  className={cn(
                    'group flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-paper',
                    !notification.read && 'bg-clay-soft/30'
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                      !notification.read ? 'text-white' : 'text-muted'
                    )}
                    style={!notification.read ? { backgroundColor: meta.color } : undefined}
                  >
                    <Icon size={13} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          'truncate text-[13.5px]',
                          notification.read ? 'font-medium text-ink-soft' : 'font-semibold text-ink'
                        )}
                      >
                        {notification.title}
                      </span>
                      {!notification.read && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-clay" aria-label="Unread" />
                      )}
                    </span>
                    {notification.body && (
                      <span className="mt-0.5 block truncate text-[12.5px] text-muted">
                        {notification.body}
                      </span>
                    )}
                    <span className="mt-1 block text-[11.5px] text-muted">
                      {relativeTime(notification.createdAt)}
                    </span>
                  </span>
                  {notification.link?.kind === 'task' && (
                    <ChevronRight
                      size={14}
                      className="mt-1.5 shrink-0 text-transparent transition-colors group-hover:text-muted"
                    />
                  )}
                </button>
              </li>
            );
          })}
          {hasMore && (
            <li className="flex justify-center border-t border-line py-3">
              <Button variant="secondary" size="sm" onClick={() => load(page + 1, true)}>
                Load older notifications
              </Button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
