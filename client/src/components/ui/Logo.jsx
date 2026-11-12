import { cn } from '@/utils/cn';

/** TaskFlow brand mark: terracotta square with a check. */
export function LogoMark({ size = 22, className }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="var(--clay)" />
      <path
        d="M9 16.5l4.2 4.2L23 11"
        stroke="#FFF8F3"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Logo({ className, markSize = 22 }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LogoMark size={markSize} />
      <span className="text-[15px] font-semibold tracking-tight text-ink">TaskFlow</span>
    </div>
  );
}
