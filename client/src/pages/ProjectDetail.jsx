import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Activity, ArrowLeft, KanbanSquare, MoreHorizontal, Pencil, Trash2, Users } from 'lucide-react';
import { projectApi } from '@/services/projectApi';
import { activityApi } from '@/services/activityApi';
import { getError } from '@/services/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useRefresh } from '@/context/RefreshContext';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Dropdown, MenuItem } from '@/components/ui/Dropdown';
import { EmptyState, ProgressBar, Skeleton } from '@/components/ui/Feedback';
import { DueBadge } from '@/components/ui/Badges';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import ActivityFeed from '@/components/ActivityFeed';
import TaskViews from '@/components/tasks/TaskViews';
import ProjectFormModal from '@/components/projects/ProjectFormModal';

const TABS = [
  { id: 'tasks', label: 'Tasks', icon: KanbanSquare },
  { id: 'activity', label: 'Activity', icon: Activity },
];

/** Project detail: stats, members, task views (scoped) and activity. */
export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canManage } = useWorkspace();
  const { versions, bump } = useRefresh();
  const [project, setProject] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('tasks');
  const [formOpen, setFormOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    projectApi
      .get(id)
      .then((p) => !cancelled && setProject(p))
      .catch((err) => !cancelled && setError(getError(err).message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, versions.projects]);

  // Project-scoped activity for the second tab.
  useEffect(() => {
    if (tab !== 'activity') return undefined;
    let cancelled = false;
    setActivitiesLoading(true);
    activityApi
      .list({ project: id, limit: 30 })
      .then((list) => !cancelled && setActivities(list))
      .catch(() => !cancelled && setActivities([]))
      .finally(() => !cancelled && setActivitiesLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tab, id, versions.activity]);

  const remove = async () => {
    setDeleting(true);
    try {
      await projectApi.remove(project._id);
      toast.success(`Project “${project.name}” deleted`);
      bump('projects', 'tasks', 'dashboard', 'activity');
      navigate('/app/projects', { replace: true });
    } catch (err) {
      toast.error(getError(err).message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24" />
        <Skeleton className="h-[30rem]" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <Link
          to="/app/projects"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-clay hover:underline"
        >
          <ArrowLeft size={13} />
          Back to projects
        </Link>
        <EmptyState
          title="Couldn't load this project"
          description={error || 'It may have been deleted.'}
          action={
            <Link to="/app/projects">
              <Button variant="secondary" size="sm">
                All projects
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const stats = project.stats || { total: 0, completed: 0, inProgress: 0, overdue: 0, progress: 0 };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <Link
          to="/app/projects"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted transition-colors hover:text-clay"
        >
          <ArrowLeft size={12} />
          Projects
        </Link>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
              <h1 className="min-w-0 truncate text-[19px] font-semibold tracking-tight text-ink">
                {project.name}
              </h1>
              {project.deadline && <DueBadge dueDate={project.deadline} />}
            </div>
            {project.description && (
              <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted">
                {project.description}
              </p>
            )}
          </div>

          {canManage && (
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setFormOpen(true)}>
                <Pencil size={13} />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Dropdown
                trigger={
                  <span className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-muted transition-colors hover:bg-paper hover:text-ink">
                    <MoreHorizontal size={15} />
                  </span>
                }
              >
                {(close) => (
                  <MenuItem
                    icon={Trash2}
                    danger
                    onClick={() => {
                      close();
                      setConfirmDelete(true);
                    }}
                  >
                    Delete project
                  </MenuItem>
                )}
              </Dropdown>
            </div>
          )}
        </div>
      </div>

      {/* Stats + members strip */}
      <div className="grid gap-3 lg:grid-cols-[1fr_18rem]">
        <div className="rounded-lg border border-line bg-card px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Stat value={stats.total} label="tasks" />
            <Stat value={stats.completed} label="completed" tone="text-status-done" />
            <Stat value={stats.inProgress} label="in progress" />
            <Stat value={stats.overdue} label="overdue" tone={stats.overdue > 0 ? 'text-priority-urgent' : ''} />
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <ProgressBar value={stats.progress} color={project.color} className="flex-1" />
            <span className="text-[12px] font-medium tabular-nums text-ink-soft">{stats.progress}%</span>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-card px-4 py-3">
          <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-muted">
            <Users size={12} />
            Members
          </h3>
          {project.members?.length > 0 ? (
            <ul className="space-y-1.5">
              {project.members.map((m) => (
                <li key={m._id} className="flex items-center gap-2">
                  <Avatar user={m} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-soft">{m.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12.5px] text-muted">
              Everyone in the workspace can see these tasks — add members from Team settings.
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-line pb-2">
        <SegmentedControl options={TABS} value={tab} onChange={setTab} />
      </div>

      {tab === 'tasks' ? (
        <TaskViews fixedProjectId={project._id} title="Project tasks" />
      ) : (
        <div className="rounded-lg border border-line bg-card px-4 py-4">
          <ActivityFeed
            activities={activities}
            loading={activitiesLoading}
            emptyHint="Actions on this project and its tasks will appear here."
          />
        </div>
      )}

      <ProjectFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        project={project}
        onSaved={(updated) => setProject((p) => ({ ...p, ...updated }))}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        loading={deleting}
        title="Delete this project?"
        message={`“${project.name}” and all of its tasks will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete project"
      />
    </div>
  );
}

function Stat({ value, label, tone = '' }) {
  return (
    <div>
      <p className={`text-[17px] font-semibold leading-tight tabular-nums ${tone || 'text-ink'}`}>{value}</p>
      <p className="text-[11.5px] text-muted">{label}</p>
    </div>
  );
}
