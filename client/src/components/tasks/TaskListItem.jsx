import { Avatar } from '@/components/ui/Avatar';
import { CheckCircle } from '@/components/ui/Feedback';
import { DueBadge, LabelChip, PriorityBadge, StatusBadge } from '@/components/ui/Badges';
import { useWorkspace } from '@/context/WorkspaceContext';
import { taskApi } from '@/services/taskApi';
import { getError } from '@/services/api';
import toast from 'react-hot-toast';
import { useRefresh } from '@/context/RefreshContext';
import { cn } from '@/utils/cn';

/**
 * One row in the task list. Desktop: aligned columns; mobile: compact card.
 * Clicking anywhere (except the checkbox) opens the task detail drawer.
 */
export default function TaskListItem({ task, onOpen }) {
  const { members } = useWorkspace();
  const { bump } = useRefresh();
  const assignee = task.assignee || members.find((m) => m.id === task.assignee?._id);
  const completed = task.status === 'completed';

  const toggleComplete = async () => {
    const status = completed ? 'todo' : 'completed';
    try {
      await taskApi.update(task._id, { status });
      toast.success(status === 'completed' ? 'Task completed' : 'Task reopened');
      bump('tasks', 'activity');
    } catch (err) {
      toast.error(getError(err).message);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(task)}
      className={cn(
        'group grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-line px-3 py-2 transition-colors last:border-b-0 hover:bg-card md:grid-cols-[26px_minmax(0,1fr)_104px_88px_120px_140px_92px] md:gap-x-2'
      )}
    >
      <CheckCircle checked={completed} onChange={toggleComplete} size={16} />

      {/* Title + labels */}
      <div className="min-w-0">
        <p
          className={cn(
            'truncate text-[13.5px] font-medium',
            completed ? 'text-muted line-through' : 'text-ink'
          )}
        >
          {task.title}
        </p>
        {task.labels?.length > 0 && (
          <div className="mt-0.5 hidden gap-1 sm:flex">
            {task.labels.slice(0, 3).map((label) => (
              <LabelChip key={label} label={label} />
            ))}
            {task.labels.length > 3 && (
              <span className="text-[11px] text-muted">+{task.labels.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Mobile meta (status + due) */}
      <div className="flex items-center gap-1.5 md:hidden">
        {task.dueDate && <DueBadge dueDate={task.dueDate} />}
        <StatusBadge status={task.status} />
      </div>

      <div className="hidden md:block">
        <StatusBadge status={task.status} />
      </div>
      <div className="hidden md:block">
        <PriorityBadge priority={task.priority} />
      </div>
      <div className="hidden items-center gap-1.5 md:flex">
        {task.assignee ? (
          <>
            <Avatar user={task.assignee} size="xs" />
            <span className="hidden truncate text-[12.5px] text-ink-soft xl:inline">
              {task.assignee.name}
            </span>
          </>
        ) : (
          <span className="text-[12.5px] text-muted">Unassigned</span>
        )}
      </div>
      <div className="hidden md:block">
        {task.project ? (
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: task.project.color || 'var(--clay)' }}
            />
            <span className="truncate text-[12.5px] text-ink-soft">{task.project.name}</span>
          </span>
        ) : (
          <span className="text-[12.5px] text-muted">—</span>
        )}
      </div>
      <div className="hidden md:block">
        <DueBadge dueDate={task.dueDate} />
      </div>
    </div>
  );
}
