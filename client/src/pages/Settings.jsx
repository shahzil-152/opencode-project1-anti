import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Camera,
  Moon,
  Monitor,
  Sun,
  Trash2,
  BellRing,
  KeyRound,
  MessageSquare,
  UserPlus,
} from 'lucide-react';
import { userApi } from '@/services/userApi';
import { getError } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useNotifications } from '@/context/NotificationContext';
import { useRefresh } from '@/context/RefreshContext';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Field, Input } from '@/components/ui/Form';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { cn } from '@/utils/cn';

const THEME_OPTIONS = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
];

function Card({ title, description, children }) {
  return (
    <section className="rounded-lg border border-line bg-card">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-[13.5px] font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-[12.5px] text-muted">{description}</p>}
      </div>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { current } = useWorkspace();
  const { refresh: refreshNotifications } = useNotifications();
  const { bump } = useRefresh();

  // Profile
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Avatar
  const fileRef = useRef(null);
  const [avatarBusy, setAvatarBusy] = useState(false);

  // Password
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordBusy, setPasswordBusy] = useState(false);

  // Notifications
  const [prefsBusy, setPrefsBusy] = useState(null);

  // Delete account
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileError('Your name cannot be empty');
      return;
    }
    setProfileBusy(true);
    setProfileError('');
    try {
      const updated = await userApi.updateProfile({ name: name.trim(), email: email.trim() });
      setUser(updated);
      toast.success('Profile updated');
      bump('members', 'activity');
    } catch (err) {
      const { message, fields } = getError(err);
      setProfileError(fields.name || fields.email || message);
    } finally {
      setProfileBusy(false);
    }
  };

  const uploadAvatar = async (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2 MB');
      return;
    }
    setAvatarBusy(true);
    try {
      const updated = await userApi.uploadAvatar(file);
      setUser(updated);
      toast.success('Avatar updated');
      bump('members', 'activity');
    } catch (err) {
      toast.error(getError(err).message);
    } finally {
      setAvatarBusy(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!passwords.current) errors.current = 'Enter your current password';
    if (passwords.next.length < 8) errors.next = 'At least 8 characters';
    else if (!/\d/.test(passwords.next)) errors.next = 'Include at least one number';
    if (passwords.confirm !== passwords.next) errors.confirm = 'Passwords do not match';
    setPasswordErrors(errors);
    if (Object.keys(errors).length) return;

    setPasswordBusy(true);
    try {
      await userApi.changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
      toast.success('Password changed');
      setPasswords({ current: '', next: '', confirm: '' });
    } catch (err) {
      const { message, fields } = getError(err);
      setPasswordErrors({ current: fields.currentPassword || fields.newPassword || message });
    } finally {
      setPasswordBusy(false);
    }
  };

  const toggleNotification = async (key) => {
    const next = !(user?.preferences?.notifications?.[key] ?? true);
    setPrefsBusy(key);
    try {
      const updated = await userApi.updatePreferences({
        notifications: { [key]: next },
      });
      setUser(updated);
    } catch (err) {
      toast.error(getError(err).message);
    } finally {
      setPrefsBusy(null);
    }
  };

  const deleteAccount = async () => {
    setDeleteBusy(true);
    try {
      const { message } = await userApi.deleteAccount();
      toast.success(message || 'Account deleted');
      await logout();
      refreshNotifications();
      window.location.assign('/');
    } catch (err) {
      toast.error(getError(err).message);
      setDeleteBusy(false);
    }
  };

  const notificationPrefs = [
    {
      key: 'assignments',
      icon: UserPlus,
      title: 'Task assignments',
      description: 'When someone assigns a task to you.',
    },
    {
      key: 'comments',
      icon: MessageSquare,
      title: 'Comments',
      description: 'When someone comments on your tasks.',
    },
    {
      key: 'deadlines',
      icon: BellRing,
      title: 'Deadline reminders',
      description: 'A heads-up when a task is due within 48 hours.',
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[17px] font-semibold tracking-tight text-ink">Settings</h1>
        <p className="mt-0.5 text-[13px] text-muted">
          Your account, appearance and notifications. Workspace settings live on the Team page.
        </p>
      </div>

      {/* Profile */}
      <Card title="Profile" description="How you appear across your workspaces.">
        <div className="flex flex-col gap-5 sm:flex-row">
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <Avatar user={user} size="xxl" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={avatarBusy}
                aria-label="Upload a new avatar"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-card text-ink-soft shadow-sm transition-colors hover:bg-clay-soft hover:text-clay disabled:opacity-60"
              >
                <Camera size={13} />
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                uploadAvatar(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <p className="max-w-36 text-center text-[11px] leading-snug text-muted">
              PNG, JPG or WebP — up to 2 MB
            </p>
          </div>

          <form onSubmit={saveProfile} className="flex-1 space-y-3">
            <Field label="Full name">
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
            </Field>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            {profileError && <p className="text-[12.5px] text-red-600 dark:text-red-400">{profileError}</p>}
            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="sm" loading={profileBusy}>
                Save profile
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {/* Appearance */}
      <Card title="Appearance" description="Choose how TaskFlow looks on this device.">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl options={THEME_OPTIONS} value={theme} onChange={setTheme} />
          <p className="text-[12px] text-muted">Follows your preference across devices.</p>
        </div>
      </Card>

      {/* Notifications */}
      <Card title="Notifications" description="What deserves a ping in your inbox.">
        <ul className="divide-y divide-line">
          {notificationPrefs.map((pref) => {
            const enabled = user?.preferences?.notifications?.[pref.key] ?? true;
            const busy = prefsBusy === pref.key;
            return (
              <li key={pref.key} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-clay-soft text-clay">
                  <pref.icon size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink">{pref.title}</p>
                  <p className="text-[12px] text-muted">{pref.description}</p>
                </div>
                {/* Handmade switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={`Toggle ${pref.title}`}
                  disabled={busy}
                  onClick={() => toggleNotification(pref.key)}
                  className={cn(
                    'relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-60',
                    enabled ? 'bg-clay' : 'bg-line-strong'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
                      enabled ? 'translate-x-[18px]' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Password */}
      <Card title="Password" description="Change your sign-in password.">
        <form onSubmit={changePassword} className="max-w-sm space-y-3">
          <Field label="Current password" error={passwordErrors.current}>
            <Input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
              autoComplete="current-password"
            />
          </Field>
          <Field label="New password" error={passwordErrors.next} hint="At least 8 characters, including a number">
            <Input
              type="password"
              value={passwords.next}
              onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm new password" error={passwordErrors.confirm}>
            <Input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              autoComplete="new-password"
            />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" loading={passwordBusy}>
              <KeyRound size={13} />
              Change password
            </Button>
          </div>
        </form>
      </Card>

      {/* Danger zone */}
      <section className="rounded-lg border border-red-200 bg-red-50/40 dark:border-red-900/50 dark:bg-red-950/20">
        <div className="border-b border-red-200 px-4 py-3 dark:border-red-900/50">
          <h2 className="text-[13.5px] font-semibold text-red-700 dark:text-red-400">Danger zone</h2>
          <p className="mt-0.5 text-[12.5px] text-red-600/80 dark:text-red-400/70">
            These actions affect your whole account.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-[13px] font-medium text-red-700 dark:text-red-400">Delete account</p>
            <p className="text-[12px] text-red-600/80 dark:text-red-400/70">
              Your account is deactivated and you're signed out everywhere. Tasks and comments you
              created remain visible to{' '}
              {current ? `${current.name} ` : 'your workspace '}
              for record-keeping.
            </p>
          </div>
          <Button variant="dangerSolid" size="sm" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={13} />
            Delete account
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteAccount}
        loading={deleteBusy}
        title="Delete your account?"
        message="This deactivates your account immediately and signs you out. Admins can no longer invite this email until you register again."
        confirmLabel="Delete my account"
      />
    </div>
  );
}
