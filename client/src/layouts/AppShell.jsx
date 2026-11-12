import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import QuickTaskModal from '@/components/tasks/QuickTaskModal';
import { LogoMark } from '@/components/ui/Logo';

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreatePreset, setQuickCreatePreset] = useState(null);
  const location = useLocation();

  // Close the mobile sidebar whenever the route changes.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const openQuickCreate = (preset = null) => {
    setQuickCreatePreset(preset);
    setQuickCreateOpen(true);
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-paper">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-line bg-paper-deep md:block">
        <Sidebar onNewTask={() => openQuickCreate(null)} />
      </aside>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <motion.div
              className="absolute inset-0 bg-black/30 dark:bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-line bg-paper-deep"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            >
              <Sidebar onNewTask={() => openQuickCreate(null)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} onNewTask={() => openQuickCreate(null)} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.08 } }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Global quick-create, opened from the topbar and sidebar */}
      <QuickTaskModal
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        preset={quickCreatePreset}
      />
    </div>
  );
}
