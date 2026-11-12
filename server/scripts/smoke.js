/**
 * TaskFlow API smoke test.
 *
 * Exercises every major flow against a running server:
 *   BASE_URL=http://localhost:5000 node scripts/smoke.js
 *
 * Assumes the seed data exists (npm run seed) because it signs in as
 * alex@taskflow.app. Exit code 0 = all checks passed.
 */
const BASE = process.env.BASE_URL || 'http://localhost:5000';
const PNG_1PX =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

// ------------------------------------------------------------------ fetch+cookies
let cookie = '';

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const setCookies = res.headers.getSetCookie?.() || [];
  if (setCookies.length) cookie = setCookies.map((c) => c.split(';')[0]).join('; ');
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

async function uploadAvatar() {
  const form = new FormData();
  form.append('image', new Blob([Buffer.from(PNG_1PX, 'base64')], { type: 'image/png' }), 'a.png');
  const res = await fetch(`${BASE}/api/users/me/avatar`, {
    method: 'POST',
    headers: cookie ? { Cookie: cookie } : {},
    body: form,
  });
  const setCookies = res.headers.getSetCookie?.() || [];
  if (setCookies.length) cookie = setCookies.map((c) => c.split(';')[0]).join('; ');
  return { status: res.status, data: await res.json().catch(() => null) };
}

// ------------------------------------------------------------------ assertions
let passed = 0;
let failed = 0;

function check(name, cond, extra) {
  if (cond) {
    passed += 1;
    console.log(`  ok  ${name}`);
  } else {
    failed += 1;
    console.error(`  FAIL ${name}${extra !== undefined ? ` -> ${JSON.stringify(extra).slice(0, 300)}` : ''}`);
  }
}

function section(title) {
  console.log(`\n== ${title}`);
}

async function main() {
  const stamp = Date.now();

  // =======================================================  fresh user journey
  section('Registration & workspace bootstrap');
  const email = `smoke-${stamp}@taskflow.app`;
  let r = await call('POST', '/api/auth/register', {
    name: 'Smoke Tester',
    email,
    password: 'Smoke1234!',
  });
  check('register -> 201', r.status === 201, r);
  const token = r.data?.user?.id;

  r = await call('GET', '/api/auth/me');
  check('me returns the new user', r.status === 200 && r.data?.user?.email === email, r);

  r = await call('GET', '/api/workspaces');
  check('personal workspace auto-created', r.status === 200 && r.data?.data?.length === 1, r);
  const wsId = r.data?.data?.[0]?._id;
  check('workspace has owner role', r.data?.data?.[0]?.role === 'owner');

  r = await call('POST', '/api/auth/register', {
    name: 'Dup',
    email,
    password: 'Smoke1234!',
  });
  check('duplicate email rejected', r.status === 409 || r.status === 400, r);

  // ------------------------------------------------------------ project CRUD
  section('Project CRUD');
  r = await call('POST', '/api/projects', {
    workspace: wsId,
    name: 'Smoke Project',
    description: 'Created by the smoke test',
    color: '#2f9e68',
    deadline: new Date(Date.now() + 12 * 86400000).toISOString(),
  });
  check('create project', r.status === 201, r);
  const projectId = r.data?.project?._id;

  r = await call('GET', `/api/projects?workspace=${wsId}`);
  check('project listed with stats', r.status === 200 && r.data?.data?.[0]?.name === 'Smoke Project', r);

  r = await call('PATCH', `/api/projects/${projectId}`, { name: 'Smoke Project (renamed)' });
  check('rename project', r.status === 200 && r.data?.project?.name === 'Smoke Project (renamed)', r);

  r = await call('GET', `/api/projects/${projectId}`);
  check('project detail with stats', r.status === 200 && r.data?.project?.stats?.total === 0, r);

  // -------------------------------------------------------------- task CRUD
  section('Task CRUD + views');
  r = await call('POST', '/api/tasks', {
    workspace: wsId,
    title: 'First smoke task',
    description: 'Testing 1 2 3',
    status: 'todo',
    priority: 'high',
    project: projectId,
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    labels: ['qa', 'smoke'],
  });
  check('create task', r.status === 201, r);
  const taskA = r.data?.task?._id;

  r = await call('POST', '/api/tasks', {
    workspace: wsId,
    title: 'Second smoke task',
    status: 'todo',
    priority: 'low',
    project: projectId,
  });
  const taskB = r.data?.task?._id;
  r = await call('POST', '/api/tasks', {
    workspace: wsId,
    title: 'Third smoke task',
    status: 'backlog',
    priority: 'urgent',
    assignee: token,
  });
  const taskC = r.data?.task?._id;
  check('create two more tasks', Boolean(taskB && taskC));

  r = await call('POST', '/api/tasks', { workspace: wsId, title: '' });
  check('empty title rejected by validator', r.status === 422 || r.status === 400, r);

  r = await call('GET', `/api/tasks?workspace=${wsId}`);
  check('list all tasks (3)', r.status === 200 && r.data?.data?.length === 3, r);

  r = await call('GET', `/api/tasks?workspace=${wsId}&status=backlog`);
  check('filter by status', r.data?.data?.every((t) => t.status === 'backlog') && r.data?.data?.length === 1, r);

  r = await call('GET', `/api/tasks?workspace=${wsId}&priority=high,urgent`);
  check('filter by priority', r.status === 200, r);

  r = await call('GET', `/api/tasks?workspace=${wsId}&q=smoke task`);
  check('search matches', r.status === 200 && r.data?.data?.length === 3, r);

  r = await call('GET', `/api/tasks?workspace=${wsId}&sort=-priority`);
  check('sort works', r.status === 200, r);

  r = await call('GET', `/api/tasks?workspace=${wsId}&view=board`);
  check('board view returns full columns', r.status === 200, r);

  r = await call('GET', `/api/tasks/${taskA}`);
  check('task detail with comments array', r.status === 200 && Array.isArray(r.data?.comments), r);

  r = await call('PATCH', `/api/tasks/${taskA}`, {
    title: 'First smoke task (edited)',
    priority: 'urgent',
    status: 'in_progress',
  });
  check('update task fields', r.status === 200 && r.data?.task?.priority === 'urgent', r);

  // ----------------------------------------------------------- kanban reorder
  section('Kanban drag & drop persistence');
  r = await call('PUT', '/api/tasks/reorder', {
    workspace: wsId,
    updates: [
      { id: taskC, status: 'in_progress', position: 0, previousStatus: 'backlog' },
      { id: taskA, status: 'in_progress', position: 100 },
    ],
  });
  check('reorder across columns', r.status === 200, r);

  r = await call('GET', `/api/tasks/${taskC}`);
  check('moved task persisted new status+position', r.data?.task?.status === 'in_progress' && r.data?.task?.position === 0, r);

  r = await call('GET', `/api/tasks?workspace=${wsId}&view=board`);
  const inProgress = r.data?.data?.filter((t) => t.status === 'in_progress') || [];
  check('board reflects the move', inProgress.length === 2, r);

  // ------------------------------------------------------ comments & subtasks
  section('Comments and subtasks');
  r = await call('POST', `/api/tasks/${taskA}/comments`, { body: 'Looks good to me' });
  check('add comment', r.status === 201, r);

  r = await call('POST', `/api/tasks/${taskA}/subtasks`, { title: 'Step one' });
  check('add subtask', r.status === 201, r);
  const subtaskId = r.data?.subtask?._id;

  r = await call('POST', `/api/tasks/${taskA}/subtasks`, { title: 'Step two' });
  r = await call('PATCH', `/api/tasks/${taskA}/subtasks/${subtaskId}`, { completed: true });
  check('toggle subtask', r.status === 200 && r.data?.subtask?.completed === true, r);

  r = await call('GET', `/api/tasks/${taskA}`);
  check('detail includes subtasks + comments', r.data?.task?.subtasks?.length === 2 && r.data?.comments?.length === 1, r);

  r = await call('DELETE', `/api/tasks/${taskA}/subtasks/${subtaskId}`);
  check('remove subtask', r.status === 204, r);

  // ------------------------------------------------------ activity/dashboard
  section('Dashboard, activity, search');
  r = await call('GET', `/api/dashboard?workspace=${wsId}`);
  check('dashboard aggregates', r.status === 200 && r.data?.stats?.total === 3, r);
  check('dashboard chart has 14 days', r.data?.completions?.length === 14);

  r = await call('GET', `/api/activity?workspace=${wsId}`);
  check('activity feed populated', r.status === 200 && r.data?.data?.length > 0, r);

  r = await call('GET', `/api/activity?workspace=${wsId}&project=${projectId}`);
  check('project-scoped activity', r.status === 200, r);

  r = await call('GET', `/api/search?q=smoke&workspace=${wsId}`);
  check('global search finds tasks', r.status === 200, r);

  // ------------------------------------------------------------ account
  section('Profile, password, avatar');
  r = await call('PATCH', '/api/users/me', { name: 'Smoke Tester Renamed' });
  check('rename profile', r.status === 200 && r.data?.user?.name === 'Smoke Tester Renamed', r);

  r = await call('PATCH', '/api/users/me/preferences', {
    theme: 'dark',
    notifications: { comments: false },
  });
  check('update preferences', r.status === 200 && r.data?.user?.preferences?.theme === 'dark', r);

  const up = await uploadAvatar();
  check('avatar upload', up.status === 200 && Boolean(up.data?.user?.avatarUrl), up);

  r = await call('PATCH', '/api/users/me/password', {
    currentPassword: 'wrong-password',
    newPassword: 'Nope1234!',
  });
  check('wrong current password rejected', r.status === 401 || r.status === 400, r);

  r = await call('PATCH', '/api/users/me/password', {
    currentPassword: 'Smoke1234!',
    newPassword: 'Smoke5678!',
  });
  check('change password', r.status === 200, r);

  // Changing the password clears the session cookie - must sign in again.
  r = await call('GET', '/api/auth/me');
  check('password change invalidated the session', r.status === 401, r);

  // sign out, sign back in with the NEW password
  r = await call('POST', '/api/auth/logout');
  check('logout', r.status === 200, r);
  r = await call('GET', '/api/auth/me');
  check('session cookie cleared', r.status === 401, r);

  r = await call('POST', '/api/auth/login', { email, password: 'Smoke1234!' });
  check('old password no longer works', r.status === 401, r);
  r = await call('POST', '/api/auth/login', { email, password: 'Smoke5678!' });
  check('login with new password', r.status === 200, r);

  // ============================================== invitation & collaboration
  section('Invitations');
  r = await call('POST', `/api/workspaces/${wsId}/invitations`, {
    email: 'alex@taskflow.app',
    role: 'member',
  });
  check('invite alex to smoke workspace', r.status === 201 && r.data?.invitation?.token, r);
  const inviteToken = r.data?.invitation?.token || r.data?.link?.split('/').pop();
  const inviteId = r.data?.invitation?._id;

  r = await call('POST', `/api/workspaces/${wsId}/invitations`, {
    email: 'alex@taskflow.app',
    role: 'member',
  });
  check('duplicate invite reuses the pending invitation', r.status === 201 && r.data?.invitation?._id === inviteId, r);

  r = await call('GET', `/api/workspaces/${wsId}/invitations`);
  check('pending invitations listed', r.status === 200 && r.data?.data?.length === 1, r);

  r = await call('GET', `/api/invitations/${inviteToken}`);
  check('invitation metadata by token', r.status === 200 && r.data?.invitation?.email === 'alex@taskflow.app', r);

  // alex accepts from his own session
  const savedCookie = cookie;
  r = await call('POST', '/api/auth/login', {
    email: 'alex@taskflow.app',
    password: 'Demo1234!',
  });
  check('alex logs in', r.status === 200, r);

  r = await call('GET', '/api/auth/me');
  check('alex session works', r.status === 200 && r.data?.user?.email === 'alex@taskflow.app');

  r = await call('GET', '/api/workspaces');
  const alexWorkspacesBefore = r.data?.data?.length;
  check('alex sees his seeded workspaces', alexWorkspacesBefore >= 2, r);
  const northwind = r.data?.data?.find((w) => w.name === 'Northwind Studio');
  const personal = r.data?.data?.find((w) => w.name === "Alex's Personal");

  r = await call('POST', `/api/invitations/${inviteToken}/accept`);
  check('alex accepts invitation', r.status === 200 && Boolean(r.data?.workspace), r);

  r = await call('GET', '/api/workspaces');
  check('alex now member of the smoke workspace too', r.data?.data?.length === alexWorkspacesBefore + 1, r);
  cookie = savedCookie; // back to the smoke user's session

  r = await call('POST', `/api/workspaces/${wsId}/invitations`, { email: 'alex@taskflow.app', role: 'member' });
  check('inviting an existing member rejected', r.status === 400, r);

  // ============================================== seeded data & authorization
  section('Seeded workspace content (Northwind)');
  r = await call('POST', '/api/auth/login', { email: 'alex@taskflow.app', password: 'Demo1234!' });

  r = await call('GET', `/api/workspaces/${northwind._id}/members`);
  check('members with task stats', r.status === 200 && r.data?.data?.length === 4 && r.data?.data?.[0]?.stats, r);

  r = await call('GET', `/api/tasks?workspace=${northwind._id}`);
  check('seeded tasks listed', r.status === 200 && r.data?.data?.length >= 15, r);

  r = await call('GET', `/api/tasks?workspace=${northwind._id}&status=overdue`);
  check('overdue due-filter works', r.status === 200, r);

  const danielId = (await call('GET', `/api/workspaces/${northwind._id}/members`)).data?.data?.find(
    (m) => m.email === 'daniel@taskflow.app'
  )?.id;
  r = await call('GET', `/api/tasks?workspace=${northwind._id}&assignee=${danielId}`);
  check('assignee filter works', r.status === 200 && r.data?.data?.length > 0, r);

  r = await call('GET', `/api/projects?workspace=${northwind._id}`);
  check('seeded projects with progress', r.status === 200 && r.data?.data?.length === 3, r);
  const websiteProject = r.data?.data?.find((p) => p.name === 'Website Relaunch');

  r = await call('GET', `/api/projects/${websiteProject._id}`);
  check('website project detail stats', r.status === 200 && r.data?.project?.stats?.total >= 7, r);

  // task from alex's PERSONAL workspace must be invisible to other members
  r = await call('GET', `/api/tasks?workspace=${personal._id}`);
  const personalTask = r.data?.data?.[0];
  check('personal workspace has tasks', Boolean(personalTask));

  const alexCookie = cookie;
  r = await call('POST', '/api/auth/login', { email: 'daniel@taskflow.app', password: 'Demo1234!' });
  check('daniel logs in', r.status === 200);

  r = await call('GET', `/api/tasks/${personalTask._id}`);
  check('cross-workspace task access blocked', r.status === 403 || r.status === 404, r);

  r = await call('GET', `/api/tasks?workspace=${personal._id}`);
  check('cross-workspace listing blocked', r.status === 403, r);

  r = await call('PATCH', `/api/projects/${websiteProject._id}`, { name: 'Hack attempt' });
  check('member cannot edit project (403)', r.status === 403, r);

  r = await call('POST', `/api/workspaces/${northwind._id}/invitations`, { email: 'x@y.com' });
  check('member cannot invite (403)', r.status === 403, r);

  r = await call('GET', `/api/notifications`);
  check('daniel inbox loads (deadline sweep runs)', r.status === 200 && Array.isArray(r.data?.data), r);

  // notifications for alex
  cookie = alexCookie;
  r = await call('GET', '/api/notifications');
  check('alex notifications listed', r.status === 200 && r.data?.data?.length >= 4, r);
  const unreadBefore = r.data?.data?.filter((n) => !n.read).length;

  r = await call('GET', '/api/notifications/unread-count');
  check('unread count matches list', r.status === 200 && r.data?.count === unreadBefore, r);

  const firstUnread = (await call('GET', '/api/notifications?unread=true')).data?.data?.[0];
  if (firstUnread) {
    r = await call('PATCH', `/api/notifications/${firstUnread._id}/read`);
    check('mark single read', r.status === 200 && r.data?.notification?.read === true, r);
  }

  r = await call('POST', '/api/notifications/read-all');
  check('mark all read', r.status === 200, r);
  r = await call('GET', '/api/notifications/unread-count');
  check('inbox zero', r.data?.count === 0, r);

  // cleanup: delete the smoke task + project so reruns stay tidy
  section('Cleanup');
  const smokeCookie = savedCookie;
  cookie = smokeCookie;
  r = await call('GET', `/api/tasks?workspace=${wsId}`);
  const smokeTasks = r.data?.data || [];
  for (const t of smokeTasks) await call('DELETE', `/api/tasks/${t._id}`);
  r = await call('DELETE', `/api/projects/${projectId}`);
  check('project cascade delete', r.status === 204, r);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('smoke test crashed:', err);
  process.exit(1);
});
