import { STATUS_META } from './constants';

/** Human sentence for an activity record, e.g. "Priya completed “Fix nav”". */
export function describeActivity(activity) {
  const who = activity.actor?.name || 'Someone';
  const title = activity.meta?.title ? `“${activity.meta.title}”` : '';
  const name = activity.meta?.name ? `“${activity.meta.name}”` : '';

  switch (activity.type) {
    case 'task.created':
      return `${who} created ${title}`;
    case 'task.completed':
      return `${who} completed ${title}`;
    case 'task.updated': {
      const to = activity.meta?.status ? STATUS_META[activity.meta.status]?.label : null;
      if (to) return `${who} moved ${title} to ${to}`;
      return `${who} updated ${title}`;
    }
    case 'task.deleted':
      return `${who} deleted ${title}`;
    case 'comment.added':
      return `${who} commented on ${title}`;
    case 'project.created':
      return `${who} created the project ${name}`;
    case 'project.updated':
      return `${who} updated the project ${name}`;
    case 'project.deleted':
      return `${who} deleted the project ${name}`;
    case 'member.joined':
      return `${who} joined the workspace`;
    case 'member.left':
      return `${who} left the workspace`;
    case 'member.removed':
      return `${who} removed a member from the workspace`;
    case 'member.invited':
      return `${who} invited ${activity.meta?.email || 'someone'}`;
    case 'member.role_updated':
      return `${who} changed a member's role to ${activity.meta?.role || 'member'}`;
    default:
      return `${who} did something`;
  }
}
