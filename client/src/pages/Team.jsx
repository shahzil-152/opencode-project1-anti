import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Copy,
  Mail,
  MoreHorizontal,
  ShieldCheck,
  Trash2,
  UserMinus,
  Users,
  XCircle,
} from 'lucide-react';
import { workspaceApi } from '@/services/workspaceApi';
import { getError } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useRefresh } from '@/context/RefreshContext';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Dropdown, MenuItem, MenuLabel } from '@/components/ui/Dropdown';
import { EmptyState, Skeleton } from '@/components/ui/Feedback';
import { Select } from '@/components/ui/Form';
import { formatShortDate, relativeTime } from '@/utils/dates';

const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

/** Team roster, invitations and the invite form (invite/roles need admin+). */
export default function Team() {
  const { user } = useAuth();
  const { currentId, current, members, refreshMembers, canManage, role: myRole } = useWorkspace();
  const { versions, bump } = useRefresh();
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [removing, setRemoving] = useState(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const loadInvitations = async () => {
    if (!currentId || !canManage) {
      setInvitations([]);
      return;
    }
    try {
      const list = await workspaceApi.listInvitations(currentId);
      setInvitations(list);
    } catch {
      setInvitations([]);
    }
  };

  useEffect(() => {
    if (!currentId) return undefined;
    let cancelled = false;
    setLoading(true);
    Promise.all([refreshMembers(), loadInvitations()]).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, versions.members]);

  const invite = async (e) => {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setInviteError('Enter a valid email address');
      return;
    }
    setInviting(true);
    setInviteError('');
    try {
      const { link } = await workspaceApi.invite(currentId, email, inviteRole);
      toast.success(`Invitation sent to ${email}`, { duration: 6000 });
      await navigator.clipboard?.writeText(link).catch(() => {});
      toast('Invite link copied to clipboard', { icon: '📋' });
      setInviteEmail('');
      await loadInvitations();
      bump('activity');
    } catch (err) {
      setInviteError(getError(err).message);
    } finally {
      setInviting(false);
    }
  };

  const copyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Invite link copied');
    } catch {
      toast.error("Couldn't copy — select the link text instead");
    }
  };

  const revoke = async (invitation) => {
    try {
      await workspaceApi.revokeInvitation(currentId, invitation.id);
      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
      toast.success(`Invitation for ${invitation.email} revoked`);
    } catch (err) {
      toast.error(getError(err).message);
    }
  };

  const changeRole = async (member, nextRole) => {
    try {
      await workspaceApi.updateMember(currentId, member.id, nextRole);
      await refreshMembers();
      bump('members', 'activity');
      toast.success(`${member.name} is now ${ROLE_LABELS[nextRole].toLowerCase()}`);
    } catch (err) {
      toast.error(getError(err).message);
    }
  };

  const removeMember = async () => {
    if (!removing) return;
    setRemoveBusy(true);
    try {
      await workspaceApi.removeMember(currentId, removing.id);
      toast.success(removing.id === user.id ? 'You left the workspace' : `${removing.name} was removed`);
      setRemoving(null);
      await refreshMembers();
      bump('members', 'activity', 'dashboard');
      // Leaving our last workspace kicks us out of the app shell.
      if (removing.id === user.id) window.location.assign('/app/dashboard');
    } catch (err) {
      toast.error(getError(err).message);
    } finally {
      setRemoveBusy(false);
    }
  };

  const leaveWorkspace = () => {
    setRemoving({ id: user.id, name: user.name, self: true });
    setLeaving(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[17px] font-semibold tracking-tight text-ink">Team</h1>
          <p className="mt-0.5 text-[13px] text-muted">
            {members.length} {members.length === 1 ? 'person' : 'people'} in {current?.name}.
          </p>
        </div>
        {myRole !== 'owner' && (
          <Button variant="secondary" size="sm" onClick={leaveWorkspace}>
            <UserMinus size={13} />
            Leave workspace
          </Button>
        )}
      </div>

      {/* Invite form */}
      {canManage ? (
        <form
          onSubmit={invite}
          className="flex flex-wrap items-end gap-2 rounded-lg border border-line bg-card px-4 py-3.5"
        >
          <div className="min-w-48 flex-1">
            <label className="mb-1 block text-[12px] font-medium text-ink-soft">
              Invite by email
            </label>
            <div className="flex items-center gap-2">
              <span className="text-muted">
                <Mail size={14} />
              </span>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@company.com"
                className="h-8 flex-1 rounded-md border border-line bg-card px-2.5 text-[13px] text-ink outline-none transition-colors placeholder:text-muted focus:border-clay"
              />
            </div>
            {inviteError && <p className="mt-1 text-[12px] text-red-600 dark:text-red-400">{inviteError}</p>}
          </div>
          <div className="w-32">
            <label className="mb-1 block text-[12px] font-medium text-ink-soft">Role</label>
            <Select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
          <Button type="submit" variant="primary" loading={inviting}>
            Send invite
          </Button>
        </form>
      ) : (
        <p className="rounded-lg border border-dashed border-line px-4 py-3 text-[13px] text-muted">
          Only workspace admins can invite new members.
        </p>
      )}

      {/* Pending invitations */}
      {canManage && invitations.length > 0 && (
        <section className="rounded-lg border border-line bg-card">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <h3 className="text-[13px] font-semibold text-ink">Pending invitations</h3>
            <span className="text-[11.5px] text-muted">{invitations.length} waiting</span>
          </div>
          <ul>
            {invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line px-4 py-2.5 last:border-b-0"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper-deep text-muted">
                  <Mail size={13} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{invitation.email}</p>
                  <p className="text-[11.5px] text-muted">
                    {ROLE_LABELS[invitation.role]} · invited {relativeTime(invitation.createdAt)} · expires{' '}
                    {formatShortDate(invitation.expiresAt)}
                  </p>
                </div>
                <code className="hidden max-w-56 truncate rounded bg-paper-deep px-1.5 py-0.5 text-[11px] text-muted lg:block">
                  {invitation.link}
                </code>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => copyLink(invitation.link)}>
                    <Copy size={12} />
                    Copy link
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => revoke(invitation)}>
                    <XCircle size={12} />
                    Revoke
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Members */}
      {loading ? (
        <div className="overflow-hidden rounded-lg border border-line bg-card">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-2.5 w-56" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <EmptyState icon={Users} title="No members found" description="Something went wrong loading the roster." />
      ) : (
        <section className="overflow-hidden rounded-lg border border-line bg-card">
          <ul>
            {members.map((member) => {
              const isSelf = member.id === user?.id;
              return (
                <li
                  key={member.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-4 py-3 last:border-b-0 hover:bg-paper"
                >
                  <Avatar user={member} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-[13.5px] font-semibold text-ink">
                      {member.name}
                      {isSelf && <span className="text-[11.5px] font-normal text-muted">(you)</span>}
                    </p>
                    <p className="truncate text-[12px] text-muted">{member.email}</p>
                  </div>

                  {/* Task stats */}
                  <div className="hidden items-center gap-4 text-center sm:flex">
                    <div>
                      <p className="text-[14px] font-semibold tabular-nums text-ink">{member.stats?.openTasks ?? 0}</p>
                      <p className="text-[10.5px] text-muted">open</p>
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold tabular-nums text-status-done">
                        {member.stats?.completedTasks ?? 0}
                      </p>
                      <p className="text-[10.5px] text-muted">done</p>
                    </div>
                  </div>

                  {/* Role */}
                  {canManage && member.role !== 'owner' ? (
                    <div className="w-28">
                      <Select
                        value={member.role}
                        onChange={(e) => changeRole(member, e.target.value)}
                        aria-label={`Role for ${member.name}`}
                        className="h-7 text-[12px]"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </Select>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-paper-deep px-2 py-1 text-[11.5px] font-medium text-ink-soft">
                      <ShieldCheck size={11} className={member.role === 'owner' ? 'text-clay' : 'text-muted'} />
                      {ROLE_LABELS[member.role]}
                    </span>
                  )}

                  {(canManage || isSelf) && member.role !== 'owner' && (
                    <Dropdown
                      trigger={
                        <span className="flex h-7 w-7 items-center justify-center rounded text-muted transition-colors hover:bg-clay-soft hover:text-clay">
                          <MoreHorizontal size={14} />
                        </span>
                      }
                    >
                      {(close) => (
                        <>
                          <MenuLabel>{member.name}</MenuLabel>
                          <MenuItem
                            icon={UserMinus}
                            danger
                            onClick={() => {
                              close();
                              setLeaving(isSelf);
                              setRemoving(member);
                            }}
                          >
                            {isSelf ? 'Leave workspace' : 'Remove from workspace'}
                          </MenuItem>
                        </>
                      )}
                    </Dropdown>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => {
          setRemoving(null);
          setLeaving(false);
        }}
        onConfirm={removeMember}
        loading={removeBusy}
        title={leaving ? 'Leave this workspace?' : 'Remove this member?'}
        message={
          leaving
            ? 'You will lose access to all tasks, projects and history in this workspace. Invited again later? An admin can re-add you.'
            : `${removing?.name} will immediately lose access to this workspace. Their existing tasks and comments stay.`
        }
        confirmLabel={leaving ? 'Leave workspace' : 'Remove member'}
      />
    </div>
  );
}
