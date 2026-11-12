import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarDays, Check, Flag, Layers, Trash2, User } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input, Select } from '@/components/ui/Form';
import { LabelChip } from '@/components/ui/Badges';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Feedback';
import SubtasksSection from './SubtasksSection';
import CommentsSection from './CommentsSection';
import { taskApi } from '@/services/taskApi';
import { projectApi } from '@/services/projectApi';
import { getError } from '@/services/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useRefresh } from '@/context/RefreshContext';
import { PRIORITIES, PRIORITY_META, STATUS_ORDER, STATUS_META } from '@/utils/constants';
import { formatShortDate, fromInputValue, relativeTime, toInputValue } from '@/utils/dates';

/**
 * Full task detail: properties, description, subtasks, comments.
 * All mutations hit the API immediately and keep the drawer in sync.
 */
export default function TaskDrawer({ taskId, onClose }) {
  const { currentId, members } = useWorkspace();
  const { bump } = useRefresh();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);

  // Inline editors
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [savingDescription, setSavingDescription] = useState(false);
  const [labelDraft, setLabelDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load task detail whenever a different task is opened.
  useEffect(() => {
    if (!taskId) {
      setTask(null);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    taskApi
      .get(taskId)
      .then(({ task: t, comments: c }) => {
        if (cancelled) return;
        setTask(t);
        setComments(c);
      })
      .catch((err) => {
        if (!cancelled) setError(getError(err).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  // Projects for the project select.
  useEffect(() => {
    if (taskId && currentId) {
      projectApi.list(currentId).then(setProjects).catch(() => {});
    }
  }, [taskId, currentId]);

  const patchTask = useCallback(
    async (changes, { successMessage } = {}) => {
      if (!task) return;
      const previous = task;
      const optimistic = { ...task, ...changes };
      setTask(optimistic);
      try {
        const updated = await taskApi.update(task._id, changes);
        setTask(updated);
        if (successMessage) toast.success(successMessage);
        bump('tasks', 'activity');
        return updated;
      } catch (err) {
        setTask(previous);
        toast.error(getError(err).message);
        return null;
      }
    },
    [task, bump]
  );

  const toggleComplete = () => {
    const completing = task.status !== 'completed';
    patchTask({ status: completing ? 'completed' : 'todo' }, {
      successMessage: completing ? 'Task completed' : 'Task reopened',
    });
  };

  const saveTitle = async () => {
    setEditingTitle(false);
    const title = titleDraft.trim();
    if (!title || title === task.title) return;
    await patchTask({ title });
  };

  const saveDescription = async () => {
    setEditingDescription(false);
    const description = descriptionDraft;
    setSavingDescription(true);
    await patchTask({ description });
    setSavingDescription(false);
  };

  const addLabel = () => {
    const label = labelDraft.trim().replace(/,$/, '');
    setLabelDraft('');
    if (!label || task.labels.includes(label) || task.labels.length >= 10) return;
    patchTask({ labels: [...task.labels, label] });
  };

  const removeLabel = (label) => {
    patchTask({ labels: task.labels.filter((l) => l !== label) });
  };

  const deleteTask = async () => {
    setDeleting(true);
    try {
      await taskApi.remove(task._id);
      toast.success('Task deleted');
      bump('tasks', 'activity');
      setConfirmDelete(false);
      onClose();
    } catch (err) {
      toast.error(getError(err).message);
      setDeleting(false);
    }
  };

  const completed = task?.status === 'completed';

  return (
    <>
      <Drawer open={Boolean(taskId)} onClose={onClose}>
        {loading && (
          <div className="flex flex-1 items-center justify-center py-24">
            <Spinner size={20} />
          </div>
        )}

        {error && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
            <p className="text-[13px] text-muted">{error}</p>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        )}

        {task && (
          <div className="flex h-full min-h-0 flex-col overflow-y-auto">
            {/* Header */}
            <div className="shrink-0 border-b border-line px-5 pb-3 pt-4">
              <div className="mb-2.5 flex items-center gap-2">
                <button
                  onClick={toggleComplete}
                  className={`flex h-6.5 items-center gap-1.5 rounded-md px-2 text-[12.5px] font-medium transition-colors ${
                    completed
                      ? 'bg-status-done/10 text-status-done hover:bg-status-done/15'
                      : 'text-ink-soft hover:bg-clay-soft hover:text-clay'
                  }`}
                >
                  <span
                    className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${
                      completed ? 'border-status-done bg-status-done text-white' : 'border-line-strong text-transparent'
                    }`}
                  >
                    <Check size={9} strokeWidth={4} />
                  </span>
                  {completed ? 'Completed' : 'Mark complete'}
                </button>
                <span className="flex-1" />
                <div className="w-32">
                  <Select
                    value={task.status}
                    onChange={(e) => patchTask({ status: e.target.value })}
                    aria-label="Status"
                    className="h-6.5 text-[12.5px]"
                  >
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_META[s].label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="w-28">
                  <Select
                    value={task.priority}
                    onChange={(e) => patchTask({ priority: e.target.value })}
                    aria-label="Priority"
                    className="h-6.5 text-[12.5px]"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {PRIORITY_META[p].label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {editingTitle ? (
                <input
                  value={titleDraft}
                  autoFocus
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveTitle();
                    if (e.key === 'Escape') {
                      setTitleDraft(task.title);
                      setEditingTitle(false);
                    }
                  }}
                  maxLength={140}
                  className="w-full rounded-md border border-clay bg-card px-2 py-1 text-[16px] font-semibold text-ink outline-none"
                />
              ) : (
                <h2
                  onClick={() => {
                    setTitleDraft(task.title);
                    setEditingTitle(true);
                  }}
                  title="Click to edit"
                  className={`cursor-text rounded-md px-2 py-1 text-[16px] font-semibold leading-snug text-ink transition-colors hover:bg-paper ${
                    completed ? 'line-through opacity-60' : ''
                  }`}
                >
                  {task.title}
                </h2>
              )}

              <p className="mt-1 px-2 text-[12px] text-muted">
                {task.project ? (
                  <>
                    <span className="font-medium" style={{ color: task.project.color }}>
                      {task.project.name}
                    </span>
                    <span className="mx-1.5">·</span>
                  </>
                ) : null}
                Created by {task.creator?.name || 'Unknown'} {relativeTime(task.createdAt)}
              </p>
            </div>

            {/* Properties rail (above the content on mobile, right side on desktop) */}
            <div className="flex min-h-0 flex-col lg:flex-row">
              <aside className="order-1 w-full shrink-0 border-b border-line px-5 py-4 lg:order-2 lg:w-64 lg:border-b-0 lg:border-l">
                <PropertyRow icon={User} label="Assignee">
                  <Select
                    value={task.assignee?._id || ''}
                    onChange={(e) => patchTask({ assignee: e.target.value || null })}
                    className="h-7 text-[12.5px]"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </Select>
                </PropertyRow>

                <PropertyRow icon={CalendarDays} label="Due date">
                  <Input
                    type="date"
                    value={toInputValue(task.dueDate)}
                    onChange={(e) => patchTask({ dueDate: fromInputValue(e.target.value) })}
                    className="h-7 text-[12.5px]"
                  />
                </PropertyRow>

                <PropertyRow icon={Layers} label="Project">
                  <Select
                    value={task.project?._id || ''}
                    onChange={(e) => patchTask({ project: e.target.value || null })}
                    className="h-7 text-[12.5px]"
                  >
                    <option value="">No project</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </PropertyRow>

                <PropertyRow icon={Flag} label="Labels">
                  <div>
                    {task.labels.length > 0 && (
                      <div className="mb-1.5 flex flex-wrap gap-1">
                        {task.labels.map((label) => (
                          <LabelChip key={label} label={label} onRemove={() => removeLabel(label)} />
                        ))}
                      </div>
                    )}
                    <input
                      value={labelDraft}
                      onChange={(e) => setLabelDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          addLabel();
                        }
                      }}
                      onBlur={addLabel}
                      placeholder={task.labels.length ? '' : 'Add label…'}
                      className="h-7 w-full rounded-md border border-line bg-card px-2 text-[12.5px] text-ink outline-none transition-colors placeholder:text-muted focus:border-clay"
                    />
                  </div>
                </PropertyRow>

                <div className="mt-4 border-t border-line pt-3">
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 size={13} />
                    Delete task
                  </Button>
                </div>
              </aside>

              {/* Main column */}
              <div className="order-2 min-w-0 flex-1 space-y-6 px-5 py-4 lg:order-1">
                <section>
                  <div className="mb-1.5 flex items-center justify-between">
                    <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted">Description</h3>
                    {!editingDescription && task.description && (
                      <button
                        className="text-[12px] font-medium text-clay hover:underline"
                        onClick={() => {
                          setDescriptionDraft(task.description || '');
                          setEditingDescription(true);
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {editingDescription ? (
                    <div>
                      <textarea
                        value={descriptionDraft}
                        autoFocus
                        onChange={(e) => setDescriptionDraft(e.target.value)}
                        rows={5}
                        maxLength={5000}
                        placeholder="Describe the task…"
                        className="w-full resize-none rounded-md border border-line bg-card px-2.5 py-1.5 text-[13px] leading-relaxed text-ink outline-none transition-colors placeholder:text-muted focus:border-clay"
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingDescription(false)}>
                          Cancel
                        </Button>
                        <Button variant="primary" size="sm" onClick={saveDescription} loading={savingDescription}>
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : task.description ? (
                    <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-ink-soft">
                      {task.description}
                    </p>
                  ) : (
                    <button
                      onClick={() => {
                        setDescriptionDraft('');
                        setEditingDescription(true);
                      }}
                      className="w-full rounded-md border border-dashed border-line px-3 py-2.5 text-left text-[13px] text-muted transition-colors hover:border-line-strong hover:text-ink-soft"
                    >
                      Add a description…
                    </button>
                  )}
                </section>

                <SubtasksSection
                  taskId={task._id}
                  subtasks={task.subtasks}
                  onChanged={(subtasks) => setTask((t) => ({ ...t, subtasks }))}
                />

                <CommentsSection taskId={task._id} comments={comments} />
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteTask}
        loading={deleting}
        title="Delete this task?"
        message={`“${task?.title}” and all of its subtasks and comments will be permanently removed.`}
        confirmLabel="Delete task"
      />
    </>
  );
}

function PropertyRow({ icon: Icon, label, children }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center gap-1.5 text-[11.5px] font-medium text-muted">
        <Icon size={11.5} aria-hidden="true" />
        {label}
      </div>
      {children}
    </div>
  );
}
