import { cn } from '@/utils/cn';

/** Compact view switcher (List / Board / Calendar). */
export function SegmentedControl({ options, value, onChange, className }) {
  return (
    <div
      className={cn('inline-flex items-center gap-0.5 rounded-md border border-line bg-card p-0.5', className)}
      role="tablist"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            title={opt.label}
            onClick={() => onChange(opt.id)}
            className={cn(
              'flex h-6.5 items-center gap-1.5 rounded-[5px] px-2.5 text-[12.5px] font-medium transition-colors',
              active ? 'bg-clay-soft text-clay' : 'text-muted hover:text-ink'
            )}
          >
            {Icon && <Icon size={13} aria-hidden="true" />}
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
