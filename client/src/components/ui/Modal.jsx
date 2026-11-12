import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-[8vh]">
          <motion.div
            className="fixed inset-0 bg-black/30 dark:bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn(
              'relative w-full rounded-lg border border-line bg-card shadow-xl',
              SIZES[size]
            )}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.99 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            {title && (
              <div className="flex h-12 items-center justify-between border-b border-line px-4">
                <h2 className="text-[14px] font-semibold text-ink">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="flex h-6 w-6 items-center justify-center rounded text-muted transition-colors hover:bg-clay-soft hover:text-clay"
                >
                  <X size={15} />
                </button>
              </div>
            )}
            <div className="px-4 py-4">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
