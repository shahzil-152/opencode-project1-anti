import { useState } from 'react';
import { Link, useLocation, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogoMark } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';
import { useAuth } from '@/context/AuthContext';
import { getError } from '@/services/api';

/** Shared shell for the auth screens. */
export function AuthCard({ title, subtitle, children }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 text-ink">
          <LogoMark size={26} />
          <span className="text-[17px] font-semibold tracking-tight">TaskFlow</span>
        </Link>
        <div className="rounded-lg border border-line bg-card p-6 shadow-sm">
          <h1 className="text-[16px] font-semibold text-ink">{title}</h1>
          <p className="mb-5 mt-1 text-[13px] text-muted">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const { user, initializing, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ?redirect=<path> wins (invitation flow), falling back to the location the
  // router stashed when an unauthenticated user hit a protected route.
  const from = location.state?.from;
  const redirectTo = searchParams.get('redirect') || (from ? from.pathname + (from.search || '') : '') || '/app/dashboard';

  if (!initializing && user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(email.trim(), password);
      toast.success('Welcome back');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Sign in" subtitle="Welcome back to your workspace.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            required
            autoFocus
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
            required
          />
        </Field>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-2.5 py-2 text-[12.5px] text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full" loading={submitting}>
          Sign in
        </Button>
      </form>

      <div className="mt-4 rounded-md border border-line bg-paper px-3 py-2.5 text-[12px] leading-relaxed text-muted">
        <span className="font-medium text-ink-soft">Demo account:</span> alex@taskflow.app /{' '}
        <span className="font-mono">Demo1234!</span>
      </div>

      <p className="mt-5 text-center text-[13px] text-muted">
        New here?{' '}
        <Link to="/register" className="font-medium text-clay hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
