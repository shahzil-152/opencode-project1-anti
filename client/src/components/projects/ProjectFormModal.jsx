import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Form';
import { projectApi } from '@/services/projectApi';
import { getError } from '@/services/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useRefresh } from '@/context/RefreshContext';
import { PROJECT_COLORS } from '@/utils/constants';
import { fromInputValue, toInputValue } from '@/utils/dates';
import { cn } from '@/utils/cn';

/**
 * Create or edit a project. Pass `project` to edit (id required) or leave it
 * null to create. Creation always targets the active workspace.
 */
export default function ProjectFormModal({ open, onClose, project = null, onSaved }) {
  const { currentId } = useWorkspace();
  const { bump } = useRefresh();
  const editing = Boolean(project);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Hydrate the form whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    setName(project?.name || '');
    setDescription(project?.description || '');
    setColor(project?.color || PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]);
    setDeadline(toInputValue(project?.deadline));
    setErrors({});
  }, [open, project]);

  const submit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!name.trim()) nextErrors.name = 'Give the project a name';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const data = {
        workspace: currentId,
        name: name.trim(),
        description: description.trim(),
        color,
        deadline: fromInputValue(deadline),
      };
      const saved = editing
        ? await projectApi.update(project._id, data)
        : await projectApi.create(data);
      toast.success(editing ? 'Project updated' : `Project “${saved.name}” created`);
      bump('projects', 'dashboard', 'activity');
      onSaved?.(saved);
      onClose();
    } catch (err) {
      const { message, fields } = getError(err);
      setErrors(Object.keys(fields).length ? fields : { form: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit project' : 'New project'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" form="project-form" type="submit" loading={saving}>
            {editing ? 'Save changes' : 'Create project'}
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={submit} className="space-y-4">
        <Field label="Name" error={errors.name}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Website relaunch"
            maxLength={80}
            autoFocus
          />
        </Field>

        <Field label="Description" hint="Optional — what is this project about?">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Goals, scope, links…"
            maxLength={2000}
            rows={3}
          />
        </Field>

        <Field label="Color">
          <div className="flex flex-wrap gap-1.5">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Use color ${c}`}
                aria-pressed={color === c}
                className={cn(
                  'h-6 w-6 rounded-full transition-transform hover:scale-110',
                  color === c && 'ring-2 ring-offset-2 ring-offset-card'
                )}
                style={{ backgroundColor: c, ...(color === c ? { boxShadow: `0 0 0 1.5px ${c}` } : {}) }}
              />
            ))}
          </div>
        </Field>

        <Field label="Target date" hint="Optional — shown on the project card.">
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>

        {errors.form && (
          <p className="rounded-md border border-red-200 bg-red-50 px-2.5 py-2 text-[12.5px] text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
            {errors.form}
          </p>
        )}
      </form>
    </Modal>
  );
}
