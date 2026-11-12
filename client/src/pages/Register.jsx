import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthCard } from './Login';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';
import { useAuth } from '@/context/AuthContext';
import { getError } from '@/services/api';

export default function Register() {
  const { user, initializing, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!initializing && user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Your name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (form.password.length < 8) next.password = 'At least 8 characters';
    else if (!/\d/.test(form.password)) next.password = 'Include at least one number';
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      toast.success('Welcome to TaskFlow');
      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      const { message, fields } = getError(err);
      setErrors(Object.keys(fields).length ? fields : { form: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Create your account" subtitle="Set up your workspace in seconds.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" error={errors.name}>
          <Input value={form.name} onChange={set('name')} placeholder="Ada Lovelace" autoComplete="name" autoFocus />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="you@company.com"
            autoComplete="email"
          />
        </Field>
        <Field label="Password" error={errors.password} hint="At least 8 characters, including a number">
          <Input
            type="password"
            value={form.password}
            onChange={set('password')}
            placeholder="Create a password"
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirm password" error={errors.confirm}>
          <Input
            type="password"
            value={form.confirm}
            onChange={set('confirm')}
            placeholder="Repeat your password"
            autoComplete="new-password"
          />
        </Field>

        {errors.form && (
          <p className="rounded-md border border-red-200 bg-red-50 px-2.5 py-2 text-[12.5px] text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
            {errors.form}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full" loading={submitting}>
          Create account
        </Button>
      </form>

      <p className="mt-5 text-center text-[13px] text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-clay hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
