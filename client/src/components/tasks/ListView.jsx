import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import TaskListItem from './TaskListItem';
import { Button } from '@/components/ui/Button';
import { STATUS_META } from '@/utils/constants';
import { cn } from '@/utils/cn';

const COLUMNS = [
  { id: 'title', label: 'Task', sort: 'title', className: '' },
  { id: 'status', label: 'Status', sort: 'status', className: 'hidden md:block' },
  { id: 'priority', label: 'Priority', sort: 'priority', className: 'hidden md:block' },
  { id: 'assignee', label: 'Assignee', sort: null, className: 'hidden md:flex' },
  { id: 'project', label: 'Project', sort: null, className: 'hidden md:block' },
  { id: 'due', label: 'Due', sort: 'due', className: 'hidden md:block' },
];

/** Sortable task table (cards on mobile). */
export default function ListView({ tasks, pagination, onLoadMore, loadingMore, onOpen, sort, onSortChange }) {
  const toggleSort = (key) => {
    if (sort === key) onSortChange(`-${key}`);
    else if (sort === `-${key}`) onSortChange(key);
    else onSortChange(key);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-card">
      {/* Header (desktop only) */}
      <div className="hidden grid-cols-[26px_minmax(0,1fr)_104px_88px_120px_140px_92px] items-center gap-x-2 border-b border-line bg-paper-deep px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted md:grid">
        <span />
        {COLUMNS.map((col) => (
          <button
            key={col.id}
            onClick={() => col.sort && toggleSort(col.sort)}
            className={cn(
              'flex items-center gap-1 text-left',
              col.sort && 'transition-colors hover:text-ink',
              col.className
            )}
          >
            {col.label}
            {col.sort && (
              <SortIcon active={sort === col.sort || sort === `-${col.sort}`} desc={sort === `-${col.sort}`} />
            )}
          </button>
        ))}
      </div>

      {tasks.length === 0 ? null : (
        <div>
          {tasks.map((task) => (
            <TaskListItem key={task._id} task={task} onOpen={onOpen} />
          ))}
        </div>
      )}

      {pagination?.hasMore && (
        <div className="flex justify-center border-t border-line py-3">
          <Button variant="secondary" size="sm" onClick={onLoadMore} loading={loadingMore}>
            Load more tasks
          </Button>
        </div>
      )}
    </div>
  );
}

function SortIcon({ active, desc }) {
  if (!active) return <ChevronsUpDown size={11} className="opacity-40" />;
  return desc ? <ArrowDown size={11} /> : <ArrowUp size={11} />;
}
