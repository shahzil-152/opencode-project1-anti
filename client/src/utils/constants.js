export const STATUS_ORDER = ['backlog', 'todo', 'in_progress', 'review', 'completed'];

export const STATUS_META = {
  backlog: { label: 'Backlog', color: 'var(--status-backlog)' },
  todo: { label: 'Todo', color: 'var(--status-todo)' },
  in_progress: { label: 'In Progress', color: 'var(--status-progress)' },
  review: { label: 'In Review', color: 'var(--status-review)' },
  completed: { label: 'Completed', color: 'var(--status-done)' },
};

export const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export const PRIORITY_META = {
  low: { label: 'Low', color: 'var(--priority-low)' },
  medium: { label: 'Medium', color: 'var(--priority-medium)' },
  high: { label: 'High', color: 'var(--priority-high)' },
  urgent: { label: 'Urgent', color: 'var(--priority-urgent)' },
};

export const DUE_FILTERS = [
  { id: 'any', label: 'Any date' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'today', label: 'Due today' },
  { id: 'week', label: 'Next 7 days' },
  { id: 'none', label: 'No due date' },
];

export const TASK_SORTS = [
  { id: '-created', label: 'Newest first' },
  { id: 'created', label: 'Oldest first' },
  { id: 'due', label: 'Due date (soonest)' },
  { id: '-due', label: 'Due date (latest)' },
  { id: 'priority', label: 'Priority (low to high)' },
  { id: '-priority', label: 'Priority (high to low)' },
  { id: 'title', label: 'Title (A-Z)' },
  { id: 'updated', label: 'Recently updated' },
];

/** Palette offered when creating/editing a project. */
export const PROJECT_COLORS = [
  '#3d7bc4',
  '#7c5ce0',
  '#b97a11',
  '#2f9e68',
  '#c24e1f',
  '#c93b3b',
  '#4e8a9c',
  '#b85c8a',
];

export const AVATAR_CSS_VARS = [
  'var(--av-0)',
  'var(--av-1)',
  'var(--av-2)',
  'var(--av-3)',
  'var(--av-4)',
  'var(--av-5)',
  'var(--av-6)',
  'var(--av-7)',
];
