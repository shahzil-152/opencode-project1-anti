import { useEffect, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import TaskCard from './TaskCard';
import { taskApi } from '@/services/taskApi';
import { getError } from '@/services/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useRefresh } from '@/context/RefreshContext';
import { STATUS_META, STATUS_ORDER } from '@/utils/constants';
import { cn } from '@/utils/cn';

function groupByStatus(tasks) {
  const columns = Object.fromEntries(STATUS_ORDER.map((s) => [s, []]));
  for (const task of tasks) {
    (columns[task.status] || columns.backlog).push(task);
  }
  return columns;
}

/** Sortable card wired into dnd-kit. */
function SortableCard({ task, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && 'opacity-40')}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} onOpen={onOpen} />
    </div>
  );
}

/** Kanban board with cross-column drag & drop persisted to the API. */
export default function BoardView({ tasks, onOpen, onAddTask }) {
  const { currentId } = useWorkspace();
  const { bump } = useRefresh();
  const [items, setItems] = useState(() => groupByStatus(tasks));
  const [activeTask, setActiveTask] = useState(null);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  // Re-derive columns whenever the parent provides fresh server data.
  useEffect(() => {
    setItems(groupByStatus(tasks));
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const findColumnOf = (id) => {
    if (String(id).startsWith('col:')) return String(id).slice(4);
    for (const status of STATUS_ORDER) {
      if (items[status].some((t) => String(t._id) === String(id))) return status;
    }
    return null;
  };

  const onDragStart = ({ active }) => {
    const status = findColumnOf(active.id);
    const task = items[status]?.find((t) => String(t._id) === String(active.id));
    setActiveTask(task);
  };

  const onDragEnd = async ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const source = findColumnOf(activeId);
    const target = String(overId).startsWith('col:') ? String(overId).slice(4) : findColumnOf(overId);
    if (!source || !target) return;

    const sourceList = items[source];
    const fromIndex = sourceList.findIndex((t) => String(t._id) === activeId);
    const activeTaskItem = sourceList[fromIndex];
    if (!activeTaskItem) return;

    const targetList = items[target];
    const insertIndex = String(overId).startsWith('col:')
      ? targetList.length
      : targetList.findIndex((t) => String(t._id) === overId);

    // No-op cases.
    if (source === target && (fromIndex === insertIndex || fromIndex === insertIndex - 1)) return;

    const next = { ...items };
    if (source === target) {
      next[source] = arrayMove(next[source], fromIndex, insertIndex);
    } else {
      const src = [...next[source]];
      src.splice(fromIndex, 1);
      const dst = [...next[target]];
      dst.splice(insertIndex, 0, activeTaskItem);
      next[source] = src;
      next[target] = dst;
    }
    setItems(next);

    // Reindex the affected columns; send only what changed.
    const changed = source === target ? [source] : [source, target];
    const previousStatus = activeTaskItem.status;
    const updates = [];
    for (const status of changed) {
      next[status].forEach((task, index) => {
        updates.push({ id: task._id, status, position: index * 100 });
      });
    }

    try {
      // The dragged task carries its previous status so the backend can log
      // the transition and notify the right people.
      const payload = updates.map((u) =>
        String(u.id) === String(activeTaskItem._id) ? { ...u, previousStatus } : u
      );
      await taskApi.reorder(currentId, payload);
      bump('tasks', 'activity');
      // Reflect the new status locally until the parent refetches.
      setItems((prev) => {
        const refreshed = { ...prev };
        refreshed[target] = refreshed[target].map((t) =>
          String(t._id) === activeId ? { ...t, status: target } : t
        );
        return refreshed;
      });
      if (previousStatus !== target && target === 'completed') {
        toast.success('Task completed');
      }
    } catch (err) {
      toast.error(getError(err).message);
      setItems(groupByStatus(tasksRef.current)); // revert on failure
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {STATUS_ORDER.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={items[status]}
            onOpen={onOpen}
            onAddTask={() => onAddTask({ status })}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeTask ? <TaskCard task={activeTask} onOpen={null} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function BoardColumn({ status, tasks, onOpen, onAddTask }) {
  const meta = STATUS_META[status];
  const { setNodeRef, isOver } = useDroppable({ id: `col:${status}` });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-w-[15.5rem] flex-1 flex-col rounded-lg bg-paper-deep/60 p-2 transition-colors',
        isOver && 'bg-clay-soft'
      )}
    >
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
        <span className="text-[12.5px] font-semibold text-ink-soft">{meta.label}</span>
        <span className="rounded-full bg-card px-1.5 text-[11px] font-medium tabular-nums text-muted">
          {tasks.length}
        </span>
        <span className="flex-1" />
        <button
          onClick={onAddTask}
          aria-label={`Add task to ${meta.label}`}
          className="flex h-5 w-5 items-center justify-center rounded text-muted transition-colors hover:bg-clay-soft hover:text-clay"
        >
          <Plus size={13} />
        </button>
      </div>

      <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-16 flex-1 flex-col gap-2">
          {tasks.map((task) => (
            <SortableCard key={task._id} task={task} onOpen={onOpen} />
          ))}
          {tasks.length === 0 && (
            <button
              onClick={onAddTask}
              className="flex min-h-16 w-full items-center justify-center rounded-lg border border-dashed border-line-strong text-[12px] text-muted transition-colors hover:border-clay hover:text-clay"
            >
              No tasks — add one
            </button>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
