import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Form';
import { LabelChip } from '@/components/ui/Badges';
import { taskApi } from '@/services/taskApi';
import { projectApi } from '@/services/projectApi';
import { getError } from '@/services/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useRefresh } from '@/context/RefreshContext';
import { PRIORITIES, PRIORITY_META, STATUS_ORDER, STATUS_META } from '@/utils/constants';
import { fromInputValue } from '@/utils/dates';

/**
 * Fast task creation used from the topbar, board columns, calendar days and
 * empty states. `preset` can prefill { status, projectId, dueDate } and
 * `fixedProjectId` locks the project (project page).
 */
export default function QuickTaskModal({ open, onClose, preset = {}, fixedProjectId = null }) {
  const { currentId, members } = useWorkspace();
  const { bump } = useRefresh();
  const [projects, setProjects] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [assignee, setAssignee] = useState('');
  const [projectId, setProjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [labels, setLabels] = useState([]);
  const [labelDraft, setLabelDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset + apply preset whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    setTitle('');
    setDescription('');
    setStatus(preset.status || 'todo');
    setPriority('medium');
    setAssignee('');
    setProjectId(fixedProjectId || preset.projectId || '');
    setDueDate(preset.dueDate || '');
    setLabels([]);
    setLabelDraft('');
    setErrors({});
    // Fetch projects for the select (cache-friendly enough for a modal).
    if (currentId) {
      projectApi.list(currentId).then(setProjects).catch(() => {});
    }
  }, [open, preset, fixedProjectId, currentId]);

  const addLabel = () => {
    const value = labelDraft.trim().replace(/,$/, '');
    if (!value) return;
    if (!labels.includes(value) && labels.length < 10) setLabels([...labels, value]);
    setLabelDraft('');
  };

  const submit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!title.trim()) nextErrors.title = 'Give the task a title';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      const task = await taskApi.create({
        workspace: currentId,
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assignee: assignee || null,
        project: projectId || null,
        dueDate: dueDate ? fromInputValue(dueDate) : null,
        labels,
      });
      toast.success('Task created');
      bump('tasks', 'activity');
      onClose();
      return task;
    } catch (err) {
      const { message, fields } = getError(err);
      setErrors(fields.title ? fields : { form: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New task"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="quick-task-form" loading={saving}>
            Create task
          </Button>
        </>
      }
    >
      <form id="quick-task-form" onSubmit={submit} className="space-y-4">
        <Field label="Title" error={errors.title}>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            autoFocus
            maxLength={140}
          />
        </Field>

        <Field label="Description" hint="Optional">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more detail, links or acceptance criteria…"
            rows={3}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_META[p].label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Project">
            <Select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={Boolean(fixedProjectId)}
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Assignee">
            <Select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Due date" hint="Optional">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>

        <Field label="Labels" hint="Press Enter or comma to add">
          <div className="rounded-md border border-line bg-card p-1.5 focus-within:border-clay">
            {labels.length > 0 && (
              <div className="mb-1 flex flex-wrap gap-1">
                {labels.map((label) => (
                  <LabelChip key={label} label={label} onRemove={() => setLabels(labels.filter((l) => l !== label))} />
                ))}
              </div>
            )}
            <input
              value={labelDraft}
              onChange={(e) => setLabelDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addLabel();
                } else if (e.key === 'Backspace' && !labelDraft && labels.length) {
                  setLabels(labels.slice(0, -1));
                }
              }}
              onBlur={addLabel}
              placeholder={labels.length ? '' : 'e.g. design, frontend'}
              className="h-6 w-full bg-transparent px-1 text-[13px] text-ink outline-none placeholder:text-muted"
            />
          </div>
        </Field>

        {errors.form && <p className="text-[12.5px] text-red-600 dark:text-red-400">{errors.form}</p>}
      </form>
    </Modal>
  );
}
