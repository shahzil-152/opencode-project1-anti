import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MoreHorizontal, Pencil, Plus, Folder, FolderPlus, Trash2, Users } from 'lucide-react';
import { projectApi } from '@/services/projectApi';
import { getError } from '@/services/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useRefresh } from '@/context/RefreshContext';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Dropdown, MenuItem } from '@/components/ui/Dropdown';
import { EmptyState, ProgressBar, Skeleton } from '@/components/ui/Feedback';
import { DueBadge } from '@/components/ui/Badges';
import ProjectFormModal from '@/components/projects/ProjectFormModal';

/** Project cards grid with create/edit/delete (edit/delete need admin+). */
export default function Projects() {
  const { currentId, members, canManage } = useWorkspace();
  const { versions, bump } = useRefresh();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    if (!currentId) return undefined;
    let cancelled = false;
    setLoading(true);
    projectApi
      .list(currentId)
      .then((list) => !cancelled && setProjects(list))
      .catch((err) => !cancelled && setError(getError(err).message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [currentId, versions.projects]);

  const remove = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await projectApi.remove(deleting._id);
      toast.success(`Project “${deleting.name}” deleted`);
      setDeleting(null);
      bump('projects', 'tasks', 'dashboard', 'activity');
    } catch (err) {
      toast.error(getError(err).message);
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[17px] font-semibold tracking-tight text-ink">Projects</h1>
          <p className="mt-0.5 text-[13px] text-muted">Group related tasks and track them together.</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={14} />
          New project
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={Folder}
          title="Couldn't load projects"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={() => bump('projects')}>
              Try again
            </Button>
          }
        />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderPlus}
          title="No projects yet"
          description="Projects keep related tasks, people and deadlines in one place."
          action={
            <Button variant="primary" size="sm" onClick={() => setFormOpen(true)}>
              <Plus size={14} />
              Create your first project
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project._id}
              className="group relative rounded-lg border border-line bg-card transition-colors hover:border-line-strong"
            >
              <Link to={`/app/projects/${project._id}`} className="block px-4 pb-3.5 pt-4">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <h3 className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink">
                    {project.name}
                  </h3>
                  {project.deadline && <DueBadge dueDate={project.deadline} />}
                </div>

                {project.description && (
                  <p className="mt-1.5 line-clamp-2 min-h-[2.1em] text-[12.5px] leading-relaxed text-muted">
                    {project.description}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <ProgressBar value={project.progress} color={project.color} className="flex-1" />
                  <span className="text-[11px] tabular-nums text-muted">
                    {project.completed}/{project.total}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex -space-x-1">
                    {project.members?.slice(0, 5).map((m) => (
                      <Avatar key={m._id} user={m} size="xs" className="ring-2 ring-card" />
                    ))}
                    {project.members?.length > 5 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-paper-deep text-[9px] font-semibold text-muted ring-2 ring-card">
                        +{project.members.length - 5}
                      </span>
                    )}
                    {project.members?.length === 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-muted">
                        <Users size={11} />
                        No members
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

              {canManage && (
                <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <Dropdown
                    trigger={
                      <span className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-paper hover:text-ink">
                        <MoreHorizontal size={14} />
                      </span>
                    }
                  >
                    {(close) => (
                      <>
                        <MenuItem
                          icon={Pencil}
                          onClick={() => {
                            close();
                            setEditing(project);
                            setFormOpen(true);
                          }}
                        >
                          Edit project
                        </MenuItem>
                        <MenuItem
                          icon={Trash2}
                          danger
                          onClick={() => {
                            close();
                            setDeleting(project);
                          }}
                        >
                          Delete project
                        </MenuItem>
                      </>
                    )}
                  </Dropdown>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ProjectFormModal open={formOpen} onClose={() => setFormOpen(false)} project={editing} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={deleteBusy}
        title="Delete this project?"
        message={`“${deleting?.name}” and all of its tasks will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete project"
      />
    </div>
  );
}
