import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  AlarmClock,
  ArrowRight,
  CheckCircle2,
  Folder,
  Inbox as InboxIcon,
  ListTodo,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { dashboardApi } from '@/services/dashboardApi';
import { getError } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useRefresh } from '@/context/RefreshContext';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState, Skeleton } from '@/components/ui/Feedback';
import { DueBadge, StatusBadge } from '@/components/ui/Badges';
import { ProgressBar } from '@/components/ui/Feedback';
import ActivityFeed from '@/components/ActivityFeed';
import { greeting } from '@/utils/dates';
import { cn } from '@/utils/cn';

/** Stat tile used across the top of the dashboard. */
function StatCard({ label, value, icon: Icon, tone, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="rounded-lg border border-line bg-card px-3.5 py-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-muted">{label}</span>
        <Icon size={13} className={cn('text-muted', tone)} />
      </div>
      <p className="mt-1 text-[22px] font-semibold leading-tight tabular-nums text-ink">{value}</p>
    </motion.div>
  );
}

/** Completions-per-day chart for the last 14 days. */
function CompletionsChart({ completions }) {
  const data = useMemo(
    () =>
      completions.map((c) => ({
        ...c,
        day: new Date(`${c.date}T12:00:00`).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      })),
    [completions]
  );
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="rounded-lg border border-line bg-card">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <h3 className="text-[13.5px] font-semibold text-ink">Completed tasks</h3>
          <p className="text-[11.5px] text-muted">Last 14 days</p>
        </div>
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-status-done">
          <TrendingUp size={12} />
          {total} finished
        </span>
      </div>
      <div className="h-44 px-2 py-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="completions-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--status-done)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--status-done)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10.5, fill: 'var(--muted)' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={18}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10.5, fill: 'var(--muted)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ stroke: 'var(--line-strong)' }}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid var(--line)',
                background: 'var(--card)',
                fontSize: 12,
                color: 'var(--ink)',
                boxShadow: '0 4px 12px rgb(0 0 0 / 0.06)',
              }}
              formatter={(value) => [value, 'Completed']}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--status-done)"
              strokeWidth={1.75}
              fill="url(#completions-fill)"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { current, currentId } = useWorkspace();
  const { versions, bump } = useRefresh();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentId) return undefined;
    let cancelled = false;
    setLoading(true);
    dashboardApi
      .overview(currentId)
      .then((data) => !cancelled && setOverview(data))
      .catch((err) => !cancelled && setError(getError(err).message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [currentId, versions.dashboard, versions.tasks, versions.projects, versions.activity]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[74px]" />
          ))}
        </div>
        <Skeleton className="h-64" />
        <div className="grid gap-5 lg:grid-cols-3">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Couldn't load your overview"
        description={error}
        action={
          <Button variant="secondary" size="sm" onClick={() => bump('dashboard')}>
            Try again
          </Button>
        }
      />
    );
  }

  const { stats, dueSoonTasks, recentActivity, projects, completions } = overview;

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[19px] font-semibold tracking-tight text-ink">
            {greeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-0.5 text-[13px] text-muted">
            Here's what's happening in <span className="font-medium text-ink-soft">{current?.name}</span>.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => bump('dashboard')}>
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Open" value={stats.pending} icon={ListTodo} delay={0} />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} tone="text-status-done" delay={0.03} />
        <StatCard label="Overdue" value={stats.overdue} icon={AlarmClock} tone={stats.overdue > 0 ? 'text-priority-urgent' : ''} delay={0.06} />
        <StatCard label="Due today" value={stats.dueToday} icon={AlarmClock} tone={stats.dueToday > 0 ? 'text-clay' : ''} delay={0.09} />
        <StatCard label="Projects" value={projects.length} icon={Folder} delay={0.12} />
        <div className="rounded-lg border border-line bg-card px-3.5 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-muted">Completion</span>
            <CheckCircle2 size={13} className="text-muted" />
          </div>
          <p className="mt-1 text-[22px] font-semibold leading-tight tabular-nums text-ink">
            {stats.completionRate}%
          </p>
          <ProgressBar value={stats.completionRate} color="var(--status-done)" className="mt-1.5" />
        </div>
      </div>

      {/* Chart */}
      <CompletionsChart completions={completions} />

      {/* Two-column: due soon + activity */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Due soon */}
        <section className="rounded-lg border border-line bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h3 className="text-[13.5px] font-semibold text-ink">Coming up</h3>
            <Link
              to="/app/tasks"
              className="flex items-center gap-1 text-[12px] font-medium text-clay transition-colors hover:text-ink"
            >
              All tasks
              <ArrowRight size={11} />
            </Link>
          </div>

          {dueSoonTasks.length === 0 ? (
            <EmptyState
              compact
              icon={AlarmClock}
              title="Nothing due soon"
              description="No deadlines in the next week. Enjoy the calm."
            />
          ) : (
            <ul>
              {dueSoonTasks.map((task) => (
                <li key={task._id}>
                  <Link
                    to={`/app/tasks?task=${task._id}`}
                    className="group flex items-center gap-3 border-b border-line px-4 py-2.5 transition-colors last:border-b-0 hover:bg-paper"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: task.project?.color || 'var(--line-strong)' }}
                      title={task.project?.name || 'No project'}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink">
                        {task.title}
                      </span>
                      <span className="text-[11.5px] text-muted">
                        {task.project?.name || 'No project'}
                      </span>
                    </span>
                    <StatusBadge status={task.status} className="hidden sm:inline-flex" />
                    <DueBadge dueDate={task.dueDate} />
                    {task.assignee ? (
                      <Avatar user={task.assignee} size="xs" />
                    ) : (
                      <span className="hidden h-5 w-5 rounded-full border border-dashed border-line-strong sm:block" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Activity */}
        <section className="rounded-lg border border-line bg-card">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h3 className="text-[13.5px] font-semibold text-ink">Activity</h3>
            <Link
              to="/app/team"
              className="flex items-center gap-1 text-[12px] font-medium text-clay transition-colors hover:text-ink"
            >
              Team
              <ArrowRight size={11} />
            </Link>
          </div>
          <div className="max-h-[22rem] overflow-y-auto px-4 py-4">
            <ActivityFeed activities={recentActivity} emptyHint="Changes across the workspace will appear here." />
          </div>
        </section>
      </div>

      {/* Projects */}
      <section className="rounded-lg border border-line bg-card">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 className="text-[13.5px] font-semibold text-ink">Projects</h3>
          <Link
            to="/app/projects"
            className="flex items-center gap-1 text-[12px] font-medium text-clay transition-colors hover:text-ink"
          >
            <Plus size={11} />
            New project
          </Link>
        </div>

        {projects.length === 0 ? (
          <EmptyState
            compact
            icon={Folder}
            title="No projects yet"
            description="Group related tasks into a project to track them together."
            action={
              <Link to="/app/projects">
                <Button variant="primary" size="sm">
                  <Plus size={13} />
                  Create a project
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/app/projects/${project.id}`}
                className="group bg-card px-4 py-3.5 transition-colors hover:bg-paper"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink group-hover:text-clay">
                    {project.name}
                  </span>
                  {project.deadline && <DueBadge dueDate={project.deadline} />}
                </div>
                {project.description && (
                  <p className="mt-1 line-clamp-1 text-[12px] text-muted">{project.description}</p>
                )}
                <div className="mt-2.5 flex items-center gap-2">
                  <ProgressBar value={project.progress} color={project.color} className="flex-1" />
                  <span className="text-[11px] tabular-nums text-muted">
                    {project.completed}/{project.total}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <div className="flex -space-x-1">
                    {project.members?.slice(0, 4).map((m) => (
                      <Avatar key={m._id} user={m} size="xs" className="ring-2 ring-card" />
                    ))}
                    {project.members?.length > 4 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-paper-deep text-[9px] font-semibold text-muted ring-2 ring-card">
                        +{project.members.length - 4}
                      </span>
                    )}
                  </div>
                  {project.overdue > 0 && (
                    <span className="text-[11px] font-medium text-priority-urgent">
                      {project.overdue} overdue
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Empty-inbox hint for brand-new users */}
      {stats.total === 0 && (
        <div className="flex items-center justify-between rounded-lg border border-dashed border-line bg-paper-deep/50 px-4 py-3">
          <p className="flex items-center gap-2 text-[13px] text-ink-soft">
            <InboxIcon size={14} className="text-muted" />
            This workspace is empty — create your first task to get things moving.
          </p>
          <Link to="/app/tasks">
            <Button variant="primary" size="sm">
              <Plus size={13} />
              New task
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
