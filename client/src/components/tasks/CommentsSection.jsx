import { useState } from 'react';
import toast from 'react-hot-toast';
import { MessageSquare } from 'lucide-react';
import { taskApi } from '@/services/taskApi';
import { getError } from '@/services/api';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { relativeTime } from '@/utils/dates';

/** Comment thread inside the task drawer. */
export default function CommentsSection({ taskId, comments: initialComments }) {
  const { user } = useAuth();
  const [comments, setComments] = useState(initialComments);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  // Keep local state in sync when the drawer switches to another task.
  const [taskIdState, setTaskIdState] = useState(taskId);
  if (taskIdState !== taskId) {
    setTaskIdState(taskId);
    setComments(initialComments);
  }

  const submit = async (e) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSaving(true);
    try {
      const comment = await taskApi.addComment(taskId, body);
      setComments((prev) => [...prev, comment]);
      setDraft('');
    } catch (err) {
      toast.error(getError(err).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <h3 className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-muted">
        <MessageSquare size={13} />
        Comments
        {comments.length > 0 && <span className="normal-case">({comments.length})</span>}
      </h3>

      {comments.length === 0 && (
        <p className="text-[13px] text-muted">No comments yet. Start the conversation below.</p>
      )}

      <ul className="space-y-3.5">
        {comments.map((comment) => (
          <li key={comment._id} className="flex gap-2.5">
            <Avatar user={comment.author} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-[13px] font-medium text-ink">{comment.author?.name || 'Unknown'}</span>
                <span className="text-[11.5px] text-muted">{relativeTime(comment.createdAt)}</span>
              </div>
              <p className="mt-0.5 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-ink-soft">
                {comment.body}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="mt-4 flex items-start gap-2.5">
        <Avatar user={user} size="sm" />
        <div className="min-w-0 flex-1">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(e);
            }}
            placeholder="Write a comment… (Ctrl+Enter to post)"
            rows={2}
            maxLength={2000}
            className="w-full resize-none rounded-md border border-line bg-card px-2.5 py-1.5 text-[13px] leading-relaxed text-ink outline-none transition-colors placeholder:text-muted focus:border-clay focus:ring-2 focus:ring-clay/15"
          />
          {draft.trim() && (
            <div className="mt-1.5 flex justify-end">
              <Button type="submit" variant="primary" size="sm" loading={saving}>
                Comment
              </Button>
            </div>
          )}
        </div>
      </form>
    </section>
  );
}
