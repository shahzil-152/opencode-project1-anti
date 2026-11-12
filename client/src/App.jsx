import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { WorkspaceProvider } from '@/context/WorkspaceContext';
import { RefreshProvider } from '@/context/RefreshContext';
import { NotificationProvider } from '@/context/NotificationContext';

import AppShell from '@/layouts/AppShell';
import CreateWorkspaceGate from '@/components/CreateWorkspaceGate';
import SplashScreen from '@/components/SplashScreen';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import InviteAccept from '@/pages/InviteAccept';
import Dashboard from '@/pages/Dashboard';
import Tasks from '@/pages/Tasks';
import Inbox from '@/pages/Inbox';
import Projects from '@/pages/Projects';
import ProjectDetail from '@/pages/ProjectDetail';
import CalendarPage from '@/pages/CalendarPage';
import Team from '@/pages/Team';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';

/** Redirects unauthenticated users to /login, remembering where they were going. */
function RequireAuth({ children }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <SplashScreen />;
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <WorkspaceProvider>
            <RefreshProvider>
              <NotificationProvider>
                <Routes>
                  {/* Public */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/invite/:token" element={<InviteAccept />} />

                  {/* App shell (protected) */}
                  <Route
                    path="/app"
                    element={
                      <RequireAuth>
                        <CreateWorkspaceGate>
                          <AppShell />
                        </CreateWorkspaceGate>
                      </RequireAuth>
                    }
                  >
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="tasks" element={<Tasks />} />
                    <Route path="inbox" element={<Inbox />} />
                    <Route path="projects" element={<Projects />} />
                    <Route path="projects/:id" element={<ProjectDetail />} />
                    <Route path="calendar" element={<CalendarPage />} />
                    <Route path="team" element={<Team />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>

                {/* Toasts styled from the design tokens so they follow the theme. */}
                <Toaster
                  position="bottom-right"
                  gutter={10}
                  toastOptions={{
                    duration: 3200,
                    style: {
                      background: 'var(--card)',
                      color: 'var(--ink)',
                      border: '1px solid var(--line)',
                      borderRadius: '10px',
                      fontSize: '13px',
                      maxWidth: '22rem',
                      padding: '10px 14px',
                      boxShadow: '0 6px 16px rgb(0 0 0 / 0.08)',
                    },
                    success: { iconTheme: { primary: 'var(--status-done)', secondary: 'var(--card)' } },
                    error: { iconTheme: { primary: 'var(--priority-urgent)', secondary: 'var(--card)' } },
                  }}
                />
              </NotificationProvider>
            </RefreshProvider>
          </WorkspaceProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
