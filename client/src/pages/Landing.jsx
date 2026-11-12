import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, CheckCircle2, KanbanSquare, Users } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
};

/** Static mini board used as the hero illustration. */
function BoardMock() {
  const columns = [
    {
      name: 'Todo',
      color: 'var(--status-todo)',
      cards: [
        { title: 'Draft sitemap and navigation', who: 'PS' },
        { title: 'Migrate blog posts to new CMS', who: 'SR' },
      ],
    },
    {
      name: 'In Progress',
      color: 'var(--status-progress)',
      cards: [
        { title: 'Design homepage hero mockups', who: 'PS', badge: 'Urgent' },
        { title: 'Implement responsive header', who: 'DK' },
      ],
    },
    {
      name: 'In Review',
      color: 'var(--status-review)',
      cards: [{ title: 'Fix navigation dropdown on mobile', who: 'DK', badge: 'High' }],
    },
    {
      name: 'Completed',
      color: 'var(--status-done)',
      cards: [
        { title: 'Audit current site performance', who: 'DK', done: true },
        { title: 'Analyze Q3 campaign metrics', who: 'SR', done: true },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {columns.map((col) => (
        <div key={col.name} className="rounded-lg border border-line bg-paper-deep p-2">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: col.color }} />
            <span className="text-[11px] font-semibold text-ink-soft">{col.name}</span>
          </div>
          <div className="space-y-1.5">
            {col.cards.map((card) => (
              <div key={card.title} className="rounded-md border border-line bg-card p-2">
                <p className={`text-[11px] font-medium leading-snug ${card.done ? 'text-muted line-through' : 'text-ink'}`}>
                  {card.title}
                </p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-clay text-[8px] font-bold text-white">
                    {card.who}
                  </span>
                  {card.badge && (
                    <span className="rounded-[4px] bg-clay-soft px-1 py-px text-[8.5px] font-semibold text-clay">
                      {card.badge}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Landing() {
  const { user, initializing } = useAuth();

  if (!initializing && user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <div className="min-h-dvh bg-paper text-ink">
      {/* Nav */}
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm">
              Get started
              <ArrowRight size={13} />
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-10 pt-14 sm:pt-20">
        <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-2.5 py-1 text-[12px] font-medium text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-status-done" />
            Built for small teams that ship
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
            Work that flows.
            <span className="block text-muted">Busywork that doesn't.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            TaskFlow gives your team one calm place for tasks, projects and deadlines —
            with a board, a calendar and a list view that all stay in sync.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link to="/register">
              <Button variant="primary" size="lg">
                Create your workspace
                <ArrowRight size={14} />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">
                Sign in
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="mt-14 rounded-xl border border-line bg-card p-3 shadow-sm"
        >
          <div className="mb-3 flex items-center gap-1.5 px-1">
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            <span className="ml-3 text-[11px] text-muted">Northwind Studio — Website Relaunch</span>
          </div>
          <BoardMock />
        </motion.div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              icon: KanbanSquare,
              title: 'Board, list or calendar',
              text: 'Every task lives in all three views. Drag a card and the change is saved instantly.',
            },
            {
              icon: Users,
              title: 'Made for collaboration',
              text: 'Invite your team, assign work, leave comments and see who did what in the activity feed.',
            },
            {
              icon: CalendarDays,
              title: 'Deadlines you can trust',
              text: 'Due dates, overdue warnings and an inbox that nudges you before things slip.',
            },
          ].map((feature, i) => (
            <motion.div key={feature.title} {...fadeUp} transition={{ duration: 0.4, delay: i * 0.08 }}>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-clay-soft text-clay">
                <feature.icon size={17} />
              </div>
              <h3 className="text-[15px] font-semibold text-ink">{feature.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">{feature.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-[12.5px] text-muted sm:flex-row">
          <span>© {new Date().getFullYear()} TaskFlow</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-status-done" />
            Built with the MERN stack
          </span>
        </div>
      </footer>
    </div>
  );
}
