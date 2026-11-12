import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Feedback';
import { EmptyState } from '@/components/ui/Feedback';
import { describeActivity } from '@/utils/activityText';
import { relativeTime } from '@/utils/dates';
import { Activity } from 'lucide-react';

/**
 * Timeline of workspace activity. Rendered from an array of populated
 * Activity documents ({ actor, type, meta, createdAt }).
 */
export default function ActivityFeed({ activities, loading = false, emptyHint = 'Nothing has happened yet.' }) {
  if (loading) {
    return (
      <ul className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3">
            <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-1/4" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (!activities || activities.length === 0) {
    return <EmptyState compact icon={Activity} title="No activity yet" description={emptyHint} />;
  }

  return (
    <ol className="relative space-y-4">
      {/* The connecting line reads as a timeline without heavy chrome. */}
      <span
        className="absolute bottom-2 left-[13px] top-2 w-px bg-line"
        aria-hidden="true"
      />
      {activities.map((activity) => (
        <li key={activity._id} className="relative flex gap-3">
          <Avatar user={activity.actor} size="sm" className="z-10 ring-2 ring-card" />
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[13px] leading-snug text-ink-soft">{describeActivity(activity)}</p>
            <p className="mt-0.5 text-[11.5px] text-muted">{relativeTime(activity.createdAt)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
