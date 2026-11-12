import { useState } from 'react';
import { FolderPlus } from 'lucide-react';
import CreateWorkspaceModal from './CreateWorkspaceModal';
import SplashScreen from './SplashScreen';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { useWorkspace } from '@/context/WorkspaceContext';

/**
 * Guards the /app routes: while workspaces load we show a splash, and if the
 * user belongs to no workspace at all (fresh account edge case, removed from
 * their last one) we offer to create one instead of rendering a broken app.
 */
export default function CreateWorkspaceGate({ children }) {
  const { workspaces, loading, refreshWorkspaces, switchWorkspace } = useWorkspace();
  const [modalOpen, setModalOpen] = useState(false);

  if (loading) return <SplashScreen />;

  if (workspaces.length === 0) {
    const onCreated = async (workspace) => {
      await refreshWorkspaces();
      switchWorkspace(workspace._id);
    };

    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper px-4">
        <EmptyState
          icon={FolderPlus}
          title="You don't belong to a workspace yet"
          description="Create one to get started, or wait for a teammate to send you an invitation link."
          action={
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              <FolderPlus size={14} />
              Create a workspace
            </Button>
          }
        />
        <CreateWorkspaceModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={onCreated} />
      </div>
    );
  }

  return children;
}
