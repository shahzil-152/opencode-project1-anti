import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PRIORITY_META } from '@/utils/constants';
import { buildMonthGrid, dateKey, isSameDay, monthLabel, weekdayHeader } from '@/utils/dates';
import { cn } from '@/utils/cn';

/**
 * Month calendar of tasks by due date. Click a chip to open the task,
 * click the + on a day to create a task due that day.
 */
export default function CalendarView({ tasks, onOpen, onCreateAt }) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const byDay = useMemo(() => {
    const map = new Map();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const key = dateKey(new Date(task.dueDate));
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(task);
    }
    return map;
  }, [tasks]);

  const weeks = useMemo(() => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);

  const shift = (delta) => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  };

  const goToday = () => setCursor(new Date(today.getFullYear(), today.getMonth(), 1));

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-card">
      {/* Calendar toolbar */}
      <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
        <h3 className="text-[14px] font-semibold text-ink">{monthLabel(cursor.getFullYear(), cursor.getMonth())}</h3>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="secondary" onClick={goToday}>
            Today
          </Button>
          <Button size="sm" variant="ghost" onClick={() => shift(-1)} aria-label="Previous month">
            <ChevronLeft size={14} />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => shift(1)} aria-label="Next month">
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-line bg-paper-deep">
        {weekdayHeader().map((day) => (
          <div
            key={day}
            className="py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {weeks.flat().map(({ date, inMonth }) => {
          const key = dateKey(date);
          const dayTasks = byDay.get(key) || [];
          const isToday = isSameDay(date, today);
          const visible = dayTasks.slice(0, 3);
          const more = dayTasks.length - visible.length;

          return (
            <div
              key={key}
              className={cn(
                'group relative min-h-[5.5rem] border-b border-r border-line p-1.5 last:border-r-0',
                !inMonth && 'bg-paper-deep/40'
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={cn(
                    'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11.5px] font-medium tabular-nums',
                    isToday
                      ? 'bg-clay text-white'
                      : inMonth
                        ? 'text-ink-soft'
                        : 'text-muted'
                  )}
                >
                  {date.getDate()}
                </span>
                <button
                  onClick={() => onCreateAt(date)}
                  aria-label={`Add task on ${monthLabel(date.getFullYear(), date.getMonth())} ${date.getDate()}`}
                  className="flex h-5 w-5 items-center justify-center rounded text-muted opacity-0 transition-all hover:bg-clay-soft hover:text-clay focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Plus size={12} />
                </button>
              </div>

              <div className="space-y-0.5">
                {visible.map((task) => (
                  <button
                    key={task._id}
                    onClick={() => onOpen(task)}
                    className={cn(
                      'flex w-full items-center gap-1.5 rounded border border-line bg-paper px-1.5 py-0.5 text-left transition-colors hover:border-clay',
                      task.status === 'completed' && 'opacity-55'
                    )}
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: PRIORITY_META[task.priority]?.color || 'var(--muted)' }}
                    />
                    <span
                      className={cn(
                        'truncate text-[11px] leading-4',
                        task.status === 'completed' ? 'text-muted line-through' : 'text-ink-soft'
                      )}
                    >
                      {task.title}
                    </span>
                  </button>
                ))}
                {more > 0 && (
                  <button
                    onClick={() => onOpen(dayTasks[3])}
                    className="w-full rounded px-1.5 py-0.5 text-left text-[10.5px] font-medium text-muted transition-colors hover:text-clay"
                  >
                    +{more} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
