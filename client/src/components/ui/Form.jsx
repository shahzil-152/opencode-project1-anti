import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

const controlBase =
  'w-full rounded-md border border-line bg-card text-[13px] text-ink placeholder:text-muted transition-colors ' +
  'focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/15 disabled:cursor-not-allowed disabled:opacity-60';

export function Input({ className, error, ...props }) {
  return (
    <input className={cn(controlBase, 'h-8 px-2.5', error && 'border-red-400 dark:border-red-500', className)} {...props} />
  );
}

export function Textarea({ className, error, rows = 4, ...props }) {
  return (
    <textarea
      rows={rows}
      className={cn(controlBase, 'resize-none px-2.5 py-1.5 leading-relaxed', error && 'border-red-400', className)}
      {...props}
    />
  );
}

export function Select({ className, error, children, ...props }) {
  return (
    <div className="relative">
      <select
        className={cn(
          controlBase,
          'h-8 appearance-none pl-2.5 pr-7',
          error && 'border-red-400',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={13}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
    </div>
  );
}

export function Field({ label, error, hint, children, className }) {
  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-[12px] font-medium text-ink-soft">{label}</label>
      )}
      {children}
      {error ? (
        <p className="mt-1 text-[12px] text-red-600 dark:text-red-400">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[12px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
