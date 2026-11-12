import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarDays } from 'lucide-react';
import CalendarView from '@/components/tasks/CalendarView';
import TaskDrawer from '@/components/tasks/TaskDrawer';
import QuickTaskModal from '@/components/tasks/QuickTaskModal';
import { Button } from '@/components/ui/Button';
import { EmptyState, Skeleton } from '@/components/ui/Feedback';
import { DueBadge, StatusBadge } from '@/components/ui/Badges';
import { taskApi } from '@/services/taskApi';
import { getError } from '@/services/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useRefresh } from '@/context/RefreshContext';

/** Full-page month calendar of tasks by due date, with an "upcoming" rail. */
export default function CalendarPage() {
  const { currentId } = useWorkspace();
  const { versions, bump } = useRefresh();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerTaskId, setDrawerTaskId] = useState(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickPreset, setQuickPreset] = useState(null);

  useEffect(() => {
    const id = searchParams.get('task');
    if (id) setDrawerTaskId(id);
  }, [searchParams]);

  const closeDrawer = () => {
    setDrawerTaskId(null);
    if (searchParams.get('task')) setSearchParams({}, { replace: true });
  };

  const load = useCallback(async () => {
    if (!currentId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await taskApi.list({ workspace: currentId, limit: 500, sort: 'due' });
      setTasks(result.data);
    } catch (err) {
      setError(getError(err).message);
    } finally {
      setLoading(false);
    }
  }, [currentId]);

  useEffect(() => {
    load();
  }, [load, versions.tasks]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Upcoming = open tasks with a due date, soonest first (top 8).
  const upcoming = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) >= today)
        .slice(0, 8),
    [tasks, today]
  );

  const overdueCount = tasks.filter(
    (t) => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < today
  ).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[17px] font-semibold tracking-tight text-ink">Calendar</h1>
        <p className="mt-0.5 text-[13px] text-muted">
          Tasks by due date. Click any chip to open it, or the + to add one.
        </p>
      </div>

      {loading ? (
        <Skeleton className="h-[34rem]" />
      ) : error ? (
        <EmptyState
          icon={CalendarDays}
          title="Couldn't load the calendar"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={load}>
              Try again
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr_18rem]">
          <CalendarView
            tasks={tasks}
            onOpen={(task) => setDrawerTaskId(task._id)}
            onCreateAt={(date) => {
              const y = date.getFullYear();
              const m = String(date.getMonth() + 1).padStart(2, '0');
              const d = String(date.getDate()).padStart(2, '0');
              setQuickPreset({ dueDate: `${y}-${m}-${d}` });
              setQuickOpen(true);
            }}
          />

          {/* Upcoming rail */}
          <aside className="order-first xl:order-last">
            <div className="rounded-lg border border-line bg-card">
              <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
                <h3 className="text-[13px] font-semibold text-ink">Upcoming</h3>
                {overdueCount > 0 && (
                  <span className="text-[11px] font-medium text-priority-urgent">
                    {overdueCount} overdue
                  </span>
                )}
              </div>
              {upcoming.length === 0 ? (
                <p className="px-3.5 py-4 text-[12.5px] text-muted">
                  Nothing scheduled ahead. Add due dates to see them here.
                </p>
              ) : (
                <ul>
                  {upcoming.map((task) => (
                    <li key={task._id}>
                      <button
                        onClick={() => setDrawerTaskId(task._id)}
                        className="w-full border-b border-line px-3.5 py-2 text-left transition-colors last:border-b-0 hover:bg-paper"
                      >
                        <span className="block truncate text-[12.5px] font-medium text-ink">
                          {task.title}
                        </span>
                        <span className="mt-1 flex items-center gap-1.5">
                          <DueBadge dueDate={task.dueDate} />
                          <StatusBadge status={task.status} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      )}

      <TaskDrawer taskId={drawerTaskId} onClose={closeDrawer} />
      <QuickTaskModal open={quickOpen} onClose={() => setQuickOpen(false)} preset={quickPreset} />
    </div>
  );
}
