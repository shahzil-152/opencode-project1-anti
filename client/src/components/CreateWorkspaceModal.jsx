import { useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Form';
import { workspaceApi } from '@/services/workspaceApi';
import { getError } from '@/services/api';

export default function CreateWorkspaceModal({ open, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Give your workspace a name');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const workspace = await workspaceApi.create({
        name: name.trim(),
        description: description.trim(),
      });
      toast.success(`Workspace “${workspace.name}” created`);
      onCreated(workspace);
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(getError(err).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New workspace"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" form="create-workspace-form" type="submit" loading={saving}>
            Create workspace
          </Button>
        </>
      }
    >
      <form id="create-workspace-form" onSubmit={submit} className="space-y-4">
        <Field label="Name" error={error}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme Studio"
            autoFocus
            maxLength={60}
          />
        </Field>
        <Field label="Description" hint="Optional - what is this workspace for?">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short description…"
            rows={3}
            maxLength={280}
          />
        </Field>
      </form>
    </Modal>
  );
}
