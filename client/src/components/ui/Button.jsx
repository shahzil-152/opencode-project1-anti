import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

const VARIANTS = {
  primary: 'bg-clay text-white hover:bg-clay-strong border border-transparent',
  secondary: 'bg-card text-ink border border-line hover:border-line-strong hover:bg-paper',
  ghost:
    'bg-transparent text-ink-soft hover:bg-clay-soft hover:text-clay border border-transparent',
  danger:
    'bg-transparent text-red-600 border border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/70 dark:hover:bg-red-950/40',
  dangerSolid: 'bg-red-600 text-white hover:bg-red-700 border border-transparent',
};

const SIZES = {
  sm: 'h-7 px-2.5 text-[12.5px] gap-1.5',
  md: 'h-8 px-3 text-[13px] gap-1.5',
  lg: 'h-9 px-3.5 text-[13.5px] gap-2',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md font-medium transition-colors duration-100',
        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-clay',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 size={13} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
