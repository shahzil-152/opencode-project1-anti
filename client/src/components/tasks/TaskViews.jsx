import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, KanbanSquare, ListTodo, Plus } from 'lucide-react';
import TaskFilters from './TaskFilters';
import ListView from './ListView';
import BoardView from './BoardView';
import CalendarView from './CalendarView';
import TaskDrawer from './TaskDrawer';
import QuickTaskModal from './QuickTaskModal';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState, Skeleton } from '@/components/ui/Feedback';
import { taskApi } from '@/services/taskApi';
import { projectApi } from '@/services/projectApi';
import { getError } from '@/services/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useRefresh } from '@/context/RefreshContext';
import { useDebounce } from '@/hooks/useDebounce';
import { toInputValue } from '@/utils/dates';

const VIEW_OPTIONS = [
  { id: 'list', label: 'List', icon: ListTodo },
  { id: 'board', label: 'Board', icon: KanbanSquare },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
];

const DEFAULT_FILTERS = { status: 'all', priority: 'all', project: 'all', assignee: 'all', due: 'any' };
const VIEW_STORAGE_KEY = 'taskflow.view';

/**
 * Shared task workspace: filters + list/board/calendar views + detail drawer.
 * `fixedProjectId` scopes everything to one project (project page).
 */
export default function TaskViews({ fixedProjectId = null, title }) {
  const { currentId, members } = useWorkspace();
  const { versions, bump } = useRefresh();
  const [searchParams, setSearchParams] = useSearchParams();

  const [view, setView] = useState(() => localStorage.getItem(VIEW_STORAGE_KEY) || 'list');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState('-created');
  const [page, setPage] = useState(1);

  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [drawerTaskId, setDrawerTaskId] = useState(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickPreset, setQuickPreset] = useState(null);

  const persistView = (next) => {
    setView(next);
    localStorage.setItem(VIEW_STORAGE_KEY, next);
    setPage(1);
  };

  // Deep link: /app/tasks?task=<id> opens the drawer (from search + notifications).
  useEffect(() => {
    const id = searchParams.get('task');
    if (id) setDrawerTaskId(id);
  }, [searchParams]);

  const closeDrawer = () => {
    setDrawerTaskId(null);
    if (searchParams.get('task')) setSearchParams({}, { replace: true });
  };

  // Projects for the filter bar (also used to label rows).
  useEffect(() => {
    if (!currentId) return undefined;
    let cancelled = false;
    projectApi
      .list(currentId)
      .then((list) => !cancelled && setProjects(list))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [currentId, versions.projects]);

  // Memoized so the load callback keeps a stable identity between renders.
  const effectiveFilters = useMemo(
    () => (fixedProjectId ? { ...filters, project: fixedProjectId } : filters),
    [filters, fixedProjectId]
  );

  const load = useCallback(
    async (targetPage = 1, append = false) => {
      if (!currentId) return;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const params = {
          workspace: currentId,
          ...effectiveFilters,
          q: debouncedSearch || undefined,
          sort,
          page: targetPage,
          limit: view === 'list' ? 25 : 500,
          view: view === 'list' ? undefined : view,
        };
        const result = await taskApi.list(params);
        setTasks((prev) => (append ? [...prev, ...result.data] : result.data));
        setPagination(result.pagination);
        setPage(targetPage);
      } catch (err) {
        setError(getError(err).message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    // filters object identity changes on every set; that's the reload trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentId, effectiveFilters, debouncedSearch, sort, view, versions.tasks]
  );

  useEffect(() => {
    load(1, false);
  }, [load]);

  // Reset paging when filters change.
  const onFiltersChange = (next) => {
    setFilters(next);
    setPage(1);
  };

  const activeFilterCount =
    Object.entries(effectiveFilters).filter(([key, value]) => DEFAULT_FILTERS[key] !== value).length +
    (debouncedSearch ? 1 : 0);

  const openQuickCreate = (preset = {}) => {
    setQuickPreset({
      ...preset,
      projectId: fixedProjectId || preset.projectId || null,
    });
    setQuickOpen(true);
  };

  const openTask = (task) => setDrawerTaskId(task._id);

  const isEmpty = !loading && tasks.length === 0;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        <div className="flex items-center gap-2">
          <SegmentedControl options={VIEW_OPTIONS} value={view} onChange={persistView} />
          <Button variant="primary" size="sm" onClick={() => openQuickCreate()}>
            <Plus size={14} />
            <span className="hidden sm:inline">New task</span>
          </Button>
        </div>
      </div>

      <TaskFilters
        filters={effectiveFilters}
        onChange={onFiltersChange}
        projects={projects}
        members={members}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchValue={search}
        hideProject={Boolean(fixedProjectId)}
      />

      {/* Content */}
      {loading ? (
        view === 'calendar' ? (
          <Skeleton className="h-[28rem] w-full" />
        ) : view === 'board' ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-72 min-w-[15.5rem] flex-1" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )
      ) : error ? (
        <EmptyState
          icon={ListTodo}
          title="Couldn't load tasks"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={() => load(1)}>
              Try again
            </Button>
          }
        />
      ) : isEmpty ? (
        <EmptyState
          icon={view === 'calendar' ? CalendarDays : ListTodo}
          title={activeFilterCount > 0 ? 'No tasks match these filters' : 'No tasks yet'}
          description={
            activeFilterCount > 0
              ? 'Try adjusting or clearing the filters above.'
              : 'Create your first task and it will show up here.'
          }
          action={
            activeFilterCount > 0 ? (
              <Button variant="secondary" size="sm" onClick={() => onFiltersChange({ ...DEFAULT_FILTERS })}>
                Clear filters
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={() => openQuickCreate()}>
                <Plus size={14} />
                New task
              </Button>
            )
          }
        />
      ) : view === 'list' ? (
        <ListView
          tasks={tasks}
          pagination={pagination}
          onLoadMore={() => load(page + 1, true)}
          loadingMore={loadingMore}
          onOpen={openTask}
          sort={sort}
          onSortChange={(next) => {
            setSort(next);
            setPage(1);
          }}
        />
      ) : view === 'board' ? (
        <BoardView tasks={tasks} onOpen={openTask} onAddTask={(preset) => openQuickCreate(preset)} />
      ) : (
        <CalendarView
          tasks={tasks}
          onOpen={openTask}
          onCreateAt={(date) => openQuickCreate({ dueDate: toInputValue(date) })}
        />
      )}

      <TaskDrawer taskId={drawerTaskId} onClose={closeDrawer} />
      <QuickTaskModal open={quickOpen} onClose={() => setQuickOpen(false)} preset={quickPreset} fixedProjectId={fixedProjectId} />
    </div>
  );
}
