import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthCard } from './Login';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Feedback';
import { invitationApi } from '@/services/invitationApi';
import { getError } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useRefresh } from '@/context/RefreshContext';

/** Invitation landing page: /invite/:token */
export default function InviteAccept() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, initializing } = useAuth();
  const { refreshWorkspaces, switchWorkspace } = useWorkspace();
  const { bump } = useRefresh();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    invitationApi
      .getByToken(token)
      .then((data) => !cancelled && setInvitation(data))
      .catch((err) => !cancelled && setError(getError(err).message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [token]);

  const accept = async () => {
    setAccepting(true);
    try {
      const { workspace, message } = await invitationApi.accept(token);
      toast.success(message);
      await refreshWorkspaces();
      switchWorkspace(workspace.id);
      bump('members', 'activity');
      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      toast.error(getError(err).message);
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <AuthCard title="Invitation" subtitle="Checking this invite link…">
        <div className="flex justify-center py-6">
          <Spinner size={20} />
        </div>
      </AuthCard>
    );
  }

  if (error) {
    return (
      <AuthCard title="Invitation" subtitle="This link doesn't work.">
        <p className="text-[13px] leading-relaxed text-muted">{error}</p>
        <Link to="/login" className="mt-4 block">
          <Button variant="secondary" className="w-full">
            Go to sign in
          </Button>
        </Link>
      </AuthCard>
    );
  }

  // Not signed in: ask to authenticate first, then return here.
  if (!initializing && !user) {
    return (
      <AuthCard
        title={`Join ${invitation.workspace?.name}`}
        subtitle={`You've been invited${invitation.invitedBy ? ` by ${invitation.invitedBy}` : ''} as ${
          invitation.role === 'admin' ? 'an admin' : 'a member'
        }.`}
      >
        <p className="mb-4 text-[13px] leading-relaxed text-muted">
          You need to be signed in as <span className="font-medium text-ink-soft">{invitation.email}</span> to accept
          this invitation.
        </p>
        <Link to={`/login?redirect=/invite/${token}`} className="block">
          <Button variant="primary" className="w-full">
            Sign in to accept
            <ArrowRight size={13} />
          </Button>
        </Link>
      </AuthCard>
    );
  }

  const emailMatches = user?.email === invitation.email;

  return (
    <AuthCard
      title={`Join ${invitation.workspace?.name}`}
      subtitle={`You've been invited${invitation.invitedBy ? ` by ${invitation.invitedBy}` : ''} as ${
        invitation.role === 'admin' ? 'an admin' : 'a member'
      }.`}
    >
      {emailMatches ? (
        <>
          <div className="mb-4 flex items-center gap-2 rounded-md border border-line bg-paper px-3 py-2.5 text-[13px] text-ink-soft">
            <Check size={14} className="text-status-done" />
            Signed in as {user.email}
          </div>
          <Button variant="primary" className="w-full" onClick={accept} loading={accepting}>
            Accept invitation
            <ArrowRight size={13} />
          </Button>
        </>
      ) : (
        <>
          <p className="text-[13px] leading-relaxed text-muted">
            This invitation was sent to <span className="font-medium text-ink-soft">{invitation.email}</span>, but
            you're signed in as <span className="font-medium text-ink-soft">{user.email}</span>. Ask an admin to
            resend the invite to the right address, or switch accounts.
          </p>
          <Link to={`/login?redirect=/invite/${token}`} className="mt-4 block">
            <Button variant="secondary" className="w-full">
              Switch account
            </Button>
          </Link>
        </>
      )}
    </AuthCard>
  );
}
