import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FolderKanban, ListTodo, Search, User } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { searchApi } from '@/services/searchApi';
import { useDebounce } from '@/hooks/useDebounce';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badges';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Feedback';
import { cn } from '@/utils/cn';

/**
 * Global search palette (Ctrl/Cmd+K or the topbar search button).
 * Wraps a trigger element; the palette opens on click.
 */
export default function SearchPalette({ children }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ tasks: [], projects: [], members: [] });
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const debounced = useDebounce(query, 250);
  const navigate = useNavigate();
  const { currentId } = useWorkspace();
  const inputRef = useRef(null);

  // Global keyboard shortcut.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      // Focus after the panel mounts.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Debounced server search scoped to the active workspace.
  useEffect(() => {
    if (!open || !currentId || debounced.trim().length < 2) {
      setResults({ tasks: [], projects: [], members: [] });
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    searchApi
      .search(debounced.trim(), currentId)
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, open, currentId]);

  const flat = [...results.tasks, ...results.projects, ...results.members];

  const go = useCallback(
    (item) => {
      setOpen(false);
      if (item.kind === 'task') navigate(`/app/tasks?task=${item._id}`);
      else if (item.kind === 'project') navigate(`/app/projects/${item._id}`);
      else navigate('/app/team');
    },
    [navigate]
  );

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && flat[activeIndex]) {
      e.preventDefault();
      go(flat[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  let cursor = -1;

  return (
    <>
      <span onClick={() => setOpen(true)} className="contents">
        {children}
      </span>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
            <motion.div
              className="absolute inset-0 bg-black/30 dark:bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              role="dialog"
              aria-label="Search"
              className="relative w-full max-w-lg overflow-hidden rounded-lg border border-line bg-card shadow-2xl"
              initial={{ opacity: 0, y: 8, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.14 }}
            >
              <div className="flex h-11 items-center gap-2.5 border-b border-line px-3.5">
                <Search size={15} className="shrink-0 text-muted" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={onKeyDown}
                  placeholder="Search tasks, projects, people…"
                  className="h-full flex-1 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-muted"
                />
                {loading && <Spinner size={14} />}
              </div>

              <div className="max-h-80 overflow-y-auto p-1.5">
                {debounced.trim().length < 2 && (
                  <p className="px-3 py-6 text-center text-[13px] text-muted">
                    Type at least two characters to search your workspace.
                  </p>
                )}

                {debounced.trim().length >= 2 && flat.length === 0 && !loading && (
                  <p className="px-3 py-6 text-center text-[13px] text-muted">
                    No matches for “{debounced.trim()}”.
                  </p>
                )}

                {results.tasks.length > 0 && (
                  <Section label="Tasks">
                    {results.tasks.map((task) => {
                      cursor += 1;
                      const idx = cursor;
                      return (
                        <Row
                          key={task._id}
                          active={idx === activeIndex}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() => go({ ...task, kind: 'task' })}
                          icon={<ListTodo size={14} className="text-muted" />}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-ink">{task.title}</span>
                            {task.project?.name && (
                              <span className="block truncate text-[11.5px] text-muted">{task.project.name}</span>
                            )}
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5">
                            <PriorityBadge priority={task.priority} />
                            <StatusBadge status={task.status} />
                          </span>
                        </Row>
                      );
                    })}
                  </Section>
                )}

                {results.projects.length > 0 && (
                  <Section label="Projects">
                    {results.projects.map((project) => {
                      cursor += 1;
                      const idx = cursor;
                      return (
                        <Row
                          key={project._id}
                          active={idx === activeIndex}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() => go({ ...project, kind: 'project' })}
                          icon={
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: project.color || 'var(--clay)' }}
                            />
                          }
                        >
                          <span className="truncate text-[13px] font-medium text-ink">{project.name}</span>
                        </Row>
                      );
                    })}
                  </Section>
                )}

                {results.members.length > 0 && (
                  <Section label="People">
                    {results.members.map((member) => {
                      cursor += 1;
                      const idx = cursor;
                      return (
                        <Row
                          key={member.id}
                          active={idx === activeIndex}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() => go({ ...member, kind: 'member' })}
                          icon={<Avatar user={member} size="xs" />}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-ink">{member.name}</span>
                            <span className="block truncate text-[11.5px] text-muted">{member.email}</span>
                          </span>
                        </Row>
                      );
                    })}
                  </Section>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-line px-3.5 py-2 text-[11px] text-muted">
                <span className="flex items-center gap-1">
                  <FolderKanban size={11} /> TaskFlow search
                </span>
                <span className="flex items-center gap-3">
                  <span>↑↓ navigate</span>
                  <span>↵ open</span>
                  <span>esc close</span>
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function Section({ label, children }) {
  return (
    <div className="mb-1">
      <div className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </div>
      {children}
    </div>
  );
}

function Row({ active, icon, children, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left transition-colors',
        active ? 'bg-clay-soft' : 'hover:bg-paper'
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
