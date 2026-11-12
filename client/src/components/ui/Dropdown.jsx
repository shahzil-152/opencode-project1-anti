import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/utils/cn';

/**
 * Minimal dropdown menu. `children` may be a function that receives a
 * close() callback, so menu items can close the menu after acting.
 * `onOpenChange(open)` fires exactly when the menu opens or closes.
 */
export function Dropdown({ trigger, children, align = 'right', widthClass = 'w-48', onOpenChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  const update = useCallback((next) => {
    setOpen(next);
    onOpenChangeRef.current?.(next);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (ref.current && !ref.current.contains(e.target)) update(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') update(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, update]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="block cursor-pointer"
        onClick={() => update(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {trigger}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            className={cn(
              'absolute z-40 mt-1.5 origin-top overflow-hidden rounded-lg border border-line bg-card py-1 shadow-lg',
              align === 'right' ? 'right-0' : 'left-0',
              widthClass
            )}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
          >
            {typeof children === 'function' ? children(() => update(false)) : children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MenuItem({ icon: Icon, children, danger, className, ...props }) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        'flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-ink-soft transition-colors',
        danger
          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'
          : 'hover:bg-clay-soft hover:text-clay',
        className
      )}
      {...props}
    >
      {Icon && <Icon size={14} className="shrink-0" aria-hidden="true" />}
      <span className="truncate">{children}</span>
    </button>
  );
}

export function MenuDivider() {
  return <div className="my-1 h-px bg-line" />;
}

export function MenuLabel({ children }) {
  return (
    <div className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
      {children}
    </div>
  );
}
