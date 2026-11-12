import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Spinner({ size = 18, className }) {
  return <Loader2 size={size} className={cn('animate-spin text-muted', className)} aria-label="Loading" />;
}

export function Skeleton({ className, style }) {
  return <div className={cn('animate-pulse rounded bg-paper-deep', className)} style={style} aria-hidden="true" />;
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3.5" style={{ width: `${88 - i * 12}%` }} />
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, compact = false }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-line text-center',
        compact ? 'px-6 py-8' : 'px-6 py-14'
      )}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-clay-soft text-clay">
        {Icon && <Icon size={18} aria-hidden="true" />}
      </div>
      <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ProgressBar({ value, color, className }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-paper-deep', className)}>
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color || 'var(--clay)' }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

export function CheckCircle({ checked, onChange, size = 17, className, title }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border transition-colors duration-100',
        checked
          ? 'border-status-done bg-status-done text-white'
          : 'border-line-strong text-transparent hover:border-status-done',
        className
      )}
      style={{ width: size, height: size }}
    >
      <Check size={size - 6} strokeWidth={3.5} aria-hidden="true" />
    </button>
  );
}
