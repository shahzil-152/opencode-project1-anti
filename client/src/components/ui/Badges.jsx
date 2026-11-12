import { cn } from '@/utils/cn';
import { STATUS_META, PRIORITY_META } from '@/utils/constants';
import { dueMeta } from '@/utils/dates';

/** Tinted pill built from a CSS color variable. */
function Pill({ color, children, className, dot }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-[5px] px-1.5 py-0.5 text-[11.5px] font-medium leading-4',
        className
      )}
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 22%, transparent)`,
      }}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      )}
      <span className="truncate">{children}</span>
    </span>
  );
}

export function StatusBadge({ status, className }) {
  const meta = STATUS_META[status];
  if (!meta) return null;
  return (
    <Pill color={meta.color} dot className={className}>
      {meta.label}
    </Pill>
  );
}

export function PriorityBadge({ priority, className }) {
  const meta = PRIORITY_META[priority];
  if (!meta) return null;
  return (
    <Pill color={meta.color} className={className}>
      {meta.label}
    </Pill>
  );
}

export function DueBadge({ dueDate, className }) {
  const meta = dueMeta(dueDate);
  if (!meta) return null;
  const toneColor =
    meta.tone === 'overdue'
      ? 'var(--priority-urgent)'
      : meta.tone === 'today'
        ? 'var(--clay)'
        : meta.tone === 'soon'
          ? 'var(--status-progress)'
          : 'var(--muted)';
  return (
    <Pill color={toneColor} className={className}>
      {meta.text}
    </Pill>
  );
}

/** Small neutral chip for task labels. */
export function LabelChip({ label, onRemove, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[5px] border border-line bg-paper-deep px-1.5 py-0.5 text-[11.5px] font-medium text-ink-soft',
        className
      )}
    >
      <span className="truncate">{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-muted transition-colors hover:text-clay"
          aria-label={`Remove label ${label}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
