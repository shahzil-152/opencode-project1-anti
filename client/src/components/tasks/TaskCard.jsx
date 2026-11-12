import { CalendarDays, MessageSquare, ListChecks } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { DueBadge, LabelChip } from '@/components/ui/Badges';
import { PRIORITY_META } from '@/utils/constants';
import { cn } from '@/utils/cn';

/**
 * Card shown in Kanban columns and the drag overlay. Presentational only -
 * drag/drop wiring lives in BoardView.
 */
export default function TaskCard({ task, onOpen, dragging = false }) {
  const completed = task.status === 'completed';
  const doneSubtasks = task.subtasks?.filter((s) => s.completed).length ?? 0;
  const totalSubtasks = task.subtasks?.length ?? 0;
  const commentCount = task._commentCount ?? task.commentCount;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(task)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen?.(task)}
      className={cn(
        'group cursor-pointer rounded-lg border border-line bg-card p-2.5 text-left transition-colors',
        'hover:border-line-strong focus-visible:outline-2 focus-visible:outline-clay',
        dragging && 'rotate-[1.5deg] shadow-xl'
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: PRIORITY_META[task.priority]?.color || 'var(--muted)' }}
          title={`Priority: ${task.priority}`}
        />
        <p
          className={cn(
            'min-w-0 flex-1 text-[13px] font-medium leading-snug',
            completed ? 'text-muted line-through' : 'text-ink'
          )}
        >
          {task.title}
        </p>
      </div>

      {task.labels?.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1 pl-3.5">
          {task.labels.slice(0, 3).map((label) => (
            <LabelChip key={label} label={label} />
          ))}
          {task.labels.length > 3 && (
            <span className="text-[11px] text-muted">+{task.labels.length - 3}</span>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center gap-2 pl-3.5">
        {totalSubtasks > 0 && (
          <span className="flex items-center gap-1 text-[11.5px] text-muted">
            <ListChecks size={11} />
            {doneSubtasks}/{totalSubtasks}
          </span>
        )}
        {commentCount > 0 && (
          <span className="flex items-center gap-1 text-[11.5px] text-muted">
            <MessageSquare size={11} />
            {commentCount}
          </span>
        )}
        {task.dueDate && !completed && (
          <span className="flex items-center">
            <DueBadge dueDate={task.dueDate} />
          </span>
        )}
        <span className="flex-1" />
        {task.assignee ? (
          <Avatar user={task.assignee} size="xs" />
        ) : (
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-line-strong">
            <CalendarDays size={10} className="text-muted" />
          </span>
        )}
      </div>
    </div>
  );
}
