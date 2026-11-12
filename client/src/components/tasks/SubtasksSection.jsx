import { useState } from 'react';
import { CheckCircle2, ListChecks, Plus, X } from 'lucide-react';
import { taskApi } from '@/services/taskApi';
import { getError } from '@/services/api';
import { CheckCircle, ProgressBar } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

/** Subtask checklist inside the task drawer. */
export default function SubtasksSection({ taskId, subtasks, onChanged }) {
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);

  const done = subtasks.filter((s) => s.completed).length;

  const add = async (e) => {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    setAdding(true);
    try {
      const subtask = await taskApi.addSubtask(taskId, title);
      onChanged([...subtasks, subtask]);
      setDraft('');
    } catch (err) {
      toast.error(getError(err).message);
    } finally {
      setAdding(false);
    }
  };

  const toggle = async (subtask) => {
    // Optimistic flip, reconciled with the server response.
    const next = subtasks.map((s) => (s._id === subtask._id ? { ...s, completed: !s.completed } : s));
    onChanged(next);
    try {
      await taskApi.updateSubtask(taskId, subtask._id, { completed: !subtask.completed });
    } catch (err) {
      toast.error(getError(err).message);
      onChanged(subtasks);
    }
  };

  const remove = async (subtask) => {
    const next = subtasks.filter((s) => s._id !== subtask._id);
    onChanged(next);
    try {
      await taskApi.removeSubtask(taskId, subtask._id);
    } catch (err) {
      toast.error(getError(err).message);
      onChanged(subtasks);
    }
  };

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-muted">
          <ListChecks size={13} />
          Subtasks
        </h3>
        {subtasks.length > 0 && (
          <span className="text-[12px] tabular-nums text-muted">
            {done} of {subtasks.length}
          </span>
        )}
      </div>

      {subtasks.length > 0 && <ProgressBar value={(done / subtasks.length) * 100} color="var(--status-done)" className="mb-2" />}

      {subtasks.length === 0 && !draft && (
        <p className="text-[13px] text-muted">Break this task into smaller steps.</p>
      )}

      <ul className="space-y-0.5">
        {subtasks.map((subtask) => (
          <li
            key={subtask._id}
            className="group flex items-center gap-2.5 rounded-md px-1.5 py-1 transition-colors hover:bg-paper"
          >
            <CheckCircle checked={subtask.completed} onChange={() => toggle(subtask)} size={16} />
            <span
              className={
                subtask.completed
                  ? 'min-w-0 flex-1 truncate text-[13px] text-muted line-through'
                  : 'min-w-0 flex-1 truncate text-[13px] text-ink'
              }
            >
              {subtask.title}
            </span>
            <button
              onClick={() => remove(subtask)}
              aria-label={`Delete subtask ${subtask.title}`}
              className="flex h-5 w-5 items-center justify-center rounded text-transparent transition-colors hover:text-red-500 group-hover:text-muted"
            >
              <X size={13} />
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="mt-1 flex items-center gap-2 px-1.5">
        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-dashed border-line-strong text-muted">
          <Plus size={9} />
        </span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a subtask…"
          maxLength={140}
          className="h-6 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
        />
        {draft.trim() && (
          <Button type="submit" size="sm" variant="primary" loading={adding}>
            Add
          </Button>
        )}
      </form>
    </section>
  );
}
