import { Search, X } from 'lucide-react';
import { Input, Select } from '@/components/ui/Form';
import { DUE_FILTERS, PRIORITIES, PRIORITY_META, STATUS_ORDER, STATUS_META } from '@/utils/constants';

const DEFAULTS = { status: 'all', priority: 'all', project: 'all', assignee: 'all', due: 'any' };

/** Filter + search bar shared by the list, board and calendar views. */
export default function TaskFilters({ filters, onChange, projects, members, onSearch, searchValue, hideProject = false }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });
  const activeCount = Object.entries(filters).filter(([key, value]) => DEFAULTS[key] !== value).length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative w-full sm:w-56">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
        <Input
          value={searchValue}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search tasks…"
          className="pl-7.5"
        />
      </div>

      <div className="w-32">
        <Select value={filters.status} onChange={set('status')} aria-label="Filter by status">
          <option value="all">All statuses</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </Select>
      </div>

      <div className="w-32">
        <Select value={filters.priority} onChange={set('priority')} aria-label="Filter by priority">
          <option value="all">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_META[p].label}
            </option>
          ))}
        </Select>
      </div>

      {!hideProject && (
        <div className="w-40">
          <Select value={filters.project} onChange={set('project')} aria-label="Filter by project">
            <option value="all">All projects</option>
            <option value="none">No project</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="w-40">
        <Select value={filters.assignee} onChange={set('assignee')} aria-label="Filter by assignee">
          <option value="all">Anyone</option>
          <option value="unassigned">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="w-36">
        <Select value={filters.due} onChange={set('due')} aria-label="Filter by due date">
          {DUE_FILTERS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </Select>
      </div>

      {activeCount > 0 && (
        <button
          onClick={() => onChange({ ...DEFAULTS })}
          className="flex h-8 items-center gap-1 rounded-md px-2 text-[12.5px] font-medium text-clay transition-colors hover:bg-clay-soft"
        >
          <X size={12} />
          Clear ({activeCount})
        </button>
      )}
    </div>
  );
}
