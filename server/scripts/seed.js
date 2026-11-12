/**
 * TaskFlow seed script - realistic demo data.
 *
 * Run with: npm run seed  (from the server/ directory)
 *
 * Demo accounts (all use the same password):
 *   alex@taskflow.app    - Alex Morgan   (workspace owner)
 *   priya@taskflow.app   - Priya Sharma  (admin)
 *   daniel@taskflow.app  - Daniel Kim   (member)
 *   sofia@taskflow.app   - Sofia Reyes  (member)
 *
 * Password: Demo1234!
 */
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const config = require('../config/env');
const { connectDB, disconnectDB, ensureDatabaseName } = require('../config/db');

const User = require('../models/User');
const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');

const PASSWORD = 'Demo1234!';

/** A date `n` days from now at a fixed hour so results feel stable. */
function days(n, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  await connectDB();
  const dbName = mongoose.connection.name;
  console.log(`\n[seed] Dropping database "${dbName}" and recreating demo data...`);
  await mongoose.connection.dropDatabase();

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // ---------------------------------------------------------------- users
  const [alex, priya, daniel, sofia] = await User.create([
    { name: 'Alex Morgan', email: 'alex@taskflow.app', password: passwordHash },
    { name: 'Priya Sharma', email: 'priya@taskflow.app', password: passwordHash },
    { name: 'Daniel Kim', email: 'daniel@taskflow.app', password: passwordHash },
    { name: 'Sofia Reyes', email: 'sofia@taskflow.app', password: passwordHash },
  ]);

  // ----------------------------------------------------------- workspaces
  const northwind = await Workspace.create({
    name: 'Northwind Studio',
    description: 'A small design & development studio. We build calm software for busy teams.',
    owner: alex._id,
  });

  const personal = await Workspace.create({
    name: "Alex's Personal",
    description: 'Side projects and life admin.',
    owner: alex._id,
  });

  await WorkspaceMember.create([
    { workspace: northwind._id, user: alex._id, role: 'owner', joinedAt: days(-120) },
    { workspace: northwind._id, user: priya._id, role: 'admin', joinedAt: days(-98) },
    { workspace: northwind._id, user: daniel._id, role: 'member', joinedAt: days(-74) },
    { workspace: northwind._id, user: sofia._id, role: 'member', joinedAt: days(-31) },
    { workspace: personal._id, user: alex._id, role: 'owner', joinedAt: days(-120) },
  ]);

  // ------------------------------------------------------------- projects
  const website = await Project.create({
    workspace: northwind._id,
    name: 'Website Relaunch',
    description: 'Rebuild the marketing site with the new brand system, faster pages and a cleaner CMS.',
    color: '#3D7BC4',
    deadline: days(18),
    members: [alex._id, priya._id, daniel._id, sofia._id],
    createdBy: alex._id,
    createdAt: days(-60),
  });

  const mobile = await Project.create({
    workspace: northwind._id,
    name: 'Mobile App v2.0',
    description: 'Ground-up rewrite of the mobile client with offline support and push notifications.',
    color: '#7C5CE0',
    deadline: days(45),
    members: [alex._id, priya._id, daniel._id],
    createdBy: alex._id,
    createdAt: days(-41),
  });

  const marketing = await Project.create({
    workspace: northwind._id,
    name: 'Q4 Marketing Campaign',
    description: 'Launch campaign for the v2 release: email, social, paid and the product itself.',
    color: '#C47D10',
    deadline: days(12),
    members: [alex._id, sofia._id],
    createdBy: alex._id,
    createdAt: days(-22),
  });

  const side = await Project.create({
    workspace: personal._id,
    name: 'Side Projects',
    description: 'Learning, portfolio work and personal admin.',
    color: '#35A06E',
    deadline: null,
    members: [alex._id],
    createdBy: alex._id,
    createdAt: days(-90),
  });

  // ---------------------------------------------------------------- tasks
  // status/priority/labels/due are deliberately spread out so the dashboard,
  // filters, kanban and calendar all have something realistic to show.
  const taskSpecs = [
    // Website Relaunch
    {
      project: website, title: 'Audit current site performance',
      description: 'Run Lighthouse across the top 20 pages, record Core Web Vitals and list the worst offenders.',
      status: 'completed', priority: 'medium', labels: ['research'],
      assignee: daniel, creator: alex, dueDate: days(-10), completedAt: days(-13), createdAt: days(-30),
    },
    {
      project: website, title: 'Draft sitemap and navigation structure',
      description: 'Restructure around the three buyer personas we interviewed. Cut the "Company" mega-menu.',
      status: 'completed', priority: 'high', labels: ['content', 'design'],
      assignee: priya, creator: alex, dueDate: days(-8), completedAt: days(-11), createdAt: days(-28),
    },
    {
      project: website, title: 'Design homepage hero mockups',
      description: 'Three directions: bold statement, product screenshot, and customer story. Present Friday.',
      status: 'in_progress', priority: 'urgent', labels: ['design'],
      assignee: priya, creator: alex, dueDate: days(2), createdAt: days(-21),
      subtasks: [
        { title: 'Direction A - bold statement', completed: true },
        { title: 'Direction B - product first', completed: true },
        { title: 'Direction C - customer story', completed: false },
        { title: 'Internal review with the team', completed: false },
      ],
    },
    {
      project: website, title: 'Implement responsive header component',
      description: 'New header with the condensed nav, mobile drawer and sticky behavior on scroll.',
      status: 'in_progress', priority: 'high', labels: ['frontend'],
      assignee: daniel, creator: alex, dueDate: days(5), createdAt: days(-14),
      subtasks: [
        { title: 'Desktop nav with dropdowns', completed: true },
        { title: 'Mobile drawer + hamburger', completed: false },
        { title: 'Sticky on scroll', completed: false },
      ],
    },
    {
      project: website, title: 'Migrate blog posts to new CMS',
      description: 'Around 80 posts. Preserve URLs, redirect the four that change, keep authors intact.',
      status: 'todo', priority: 'medium', labels: ['content'],
      assignee: sofia, creator: priya, dueDate: days(9), createdAt: days(-9),
    },
    {
      project: website, title: 'Fix navigation dropdown on mobile',
      description: 'Dropdown closes immediately after opening on iOS Safari. Likely a touch event conflict.',
      status: 'review', priority: 'high', labels: ['bug', 'frontend'],
      assignee: daniel, creator: daniel, dueDate: days(-1), createdAt: days(-4),
    },
    {
      project: website, title: 'Prepare launch announcement copy',
      description: 'Blog post + email to the existing list. Coordinate with the Q4 campaign timeline.',
      status: 'backlog', priority: 'medium', labels: ['content', 'marketing'],
      assignee: sofia, creator: alex, dueDate: null, createdAt: days(-6),
    },
    // Mobile App v2.0
    {
      project: mobile, title: 'Set up Stripe subscription payments',
      description: 'Monthly and yearly plans, 14-day trial, proration when switching plans.',
      status: 'in_progress', priority: 'urgent', labels: ['backend'],
      assignee: daniel, creator: alex, dueDate: days(1), createdAt: days(-12),
      subtasks: [
        { title: 'Plans + prices in Stripe', completed: true },
        { title: 'Checkout session endpoint', completed: true },
        { title: 'Webhook handling', completed: false },
        { title: 'Grace period + dunning', completed: false },
      ],
    },
    {
      project: mobile, title: 'Design onboarding flow screens',
      description: 'Five screens: welcome, workspace name, invite teammates, sample project, done.',
      status: 'in_progress', priority: 'high', labels: ['design'],
      assignee: priya, creator: priya, dueDate: days(3), createdAt: days(-8),
    },
    {
      project: mobile, title: 'Build push notification service',
      description: 'FCM + APNs behind one service. Respect the in-app notification preferences.',
      status: 'backlog', priority: 'high', labels: ['backend'],
      assignee: daniel, creator: alex, dueDate: days(12), createdAt: days(-5),
    },
    {
      project: mobile, title: 'Usability test with beta users',
      description: 'Five 30-minute sessions over video. Script + recording + notes in the shared drive.',
      status: 'todo', priority: 'medium', labels: ['research'],
      assignee: sofia, creator: priya, dueDate: days(6), createdAt: days(-3),
    },
    {
      project: mobile, title: 'Write API integration tests',
      description: 'Cover auth, workspaces, tasks and the reorder endpoint. Run in CI on every PR.',
      status: 'backlog', priority: 'medium', labels: ['backend', 'qa'],
      assignee: alex, creator: daniel, dueDate: days(20), createdAt: days(-2),
    },
    // Q4 Marketing Campaign
    {
      project: marketing, title: 'Plan Q4 social media calendar',
      description: 'November + December: 3 posts a week, mix of feature spotlights and customer quotes.',
      status: 'todo', priority: 'medium', labels: ['marketing', 'content'],
      assignee: sofia, creator: sofia, dueDate: days(0), createdAt: days(-7),
    },
    {
      project: marketing, title: 'Record product demo video',
      description: 'Two-minute walkthrough of task views for the launch page. Screen recording + voiceover.',
      status: 'in_progress', priority: 'high', labels: ['marketing'],
      assignee: alex, creator: sofia, dueDate: days(1), createdAt: days(-5),
      subtasks: [
        { title: 'Write the script', completed: true },
        { title: 'Record screen capture', completed: false },
        { title: 'Voiceover + captions', completed: false },
      ],
    },
    {
      project: marketing, title: 'Draft Black Friday email sequence',
      description: 'Three emails: teaser, offer day, last call. 20% off yearly plans.',
      status: 'todo', priority: 'urgent', labels: ['marketing', 'content'],
      assignee: sofia, creator: alex, dueDate: days(-2), createdAt: days(-11),
    },
    {
      project: marketing, title: 'Analyze campaign metrics from Q3',
      description: 'Open rates, CTR and signups per channel. Summary deck for the retro.',
      status: 'completed', priority: 'medium', labels: ['analytics'],
      assignee: sofia, creator: alex, dueDate: days(-6), completedAt: days(-5), createdAt: days(-16),
    },
    {
      project: marketing, title: 'Launch retargeting ad campaign',
      description: 'Pixel the pricing page, retarget visitors with the demo video. Budget $1.5k.',
      status: 'backlog', priority: 'low', labels: ['marketing'],
      assignee: sofia, creator: alex, dueDate: days(10), createdAt: days(-4),
    },
    // Personal - Side Projects
    {
      project: side, title: "Read 'Shape Up' and take notes",
      description: 'Chapters on appetite, betting and the icebergs metaphor.',
      status: 'backlog', priority: 'low', labels: ['learning'],
      assignee: alex, creator: alex, dueDate: null, createdAt: days(-25),
    },
    {
      project: side, title: 'Build portfolio case study',
      description: 'Write up the Northwind relaunch as a case study: problem, constraints, outcome.',
      status: 'in_progress', priority: 'medium', labels: ['design'],
      assignee: alex, creator: alex, dueDate: days(7), createdAt: days(-13),
    },
    {
      project: side, title: 'Set up automatic backups for photo library',
      description: 'Nightly backup to the NAS and a quarterly cold copy to an external drive.',
      status: 'todo', priority: 'high', labels: ['admin'],
      assignee: alex, creator: alex, dueDate: days(-3), createdAt: days(-20),
    },
  ];

  // Assign Kanban positions per status column.
  const statusCounters = {};
  const tasks = [];
  for (const spec of taskSpecs) {
    const { project, assignee, creator, ...rest } = spec;
    const status = rest.status || 'todo';
    const position = (statusCounters[status] = (statusCounters[status] ?? -100) + 100);
    tasks.push(
      await Task.create({
        ...rest,
        status,
        position,
        workspace: project.workspace,
        project: project._id,
        assignee: assignee._id,
        creator: creator._id,
      })
    );
  }

  // ------------------------------------------------------------------ comments
  const commentsSpec = [
    { taskIndex: 2, author: alex, body: 'Direction B feels the strongest to me. Could we make the product screenshot slightly larger?', at: days(-2, 14) },
    { taskIndex: 2, author: priya, body: 'Agreed. I will tighten the spacing around it and post an update this afternoon.', at: days(-2, 16) },
    { taskIndex: 7, author: alex, body: 'Reminder: we need the webhook handling live before the beta invite goes out on Friday.', at: days(-3, 9) },
    { taskIndex: 7, author: daniel, body: 'On it. Checkout session endpoint is done, finishing webhooks today.', at: days(-3, 11) },
    { taskIndex: 5, author: priya, body: 'Reproduced on iOS 17.4 - it also happens on the staging build, not just prod.', at: days(-1, 15) },
    { taskIndex: 13, author: sofia, body: 'Script looks great. For the voiceover, keep it under 90 seconds if you can.', at: days(-1, 10) },
  ];
  for (const c of commentsSpec) {
    const task = tasks[c.taskIndex];
    await Comment.create({
      task: task._id,
      author: c.author._id,
      body: c.body,
      createdAt: c.at,
      updatedAt: c.at,
    });
  }

  // ----------------------------------------------------------------- activity
  const activitySpec = [
    { actor: alex, type: 'project.created', entityType: 'project', entityId: website._id, meta: { name: 'Website Relaunch' }, at: days(-60) },
    { actor: priya, type: 'task.completed', entityType: 'task', entityId: tasks[1]._id, meta: { title: 'Draft sitemap and navigation structure', status: 'completed' }, at: days(-11, 12) },
    { actor: daniel, type: 'task.completed', entityType: 'task', entityId: tasks[0]._id, meta: { title: 'Audit current site performance', status: 'completed' }, at: days(-13, 17) },
    { actor: alex, type: 'member.joined', entityType: 'member', meta: { name: 'Sofia Reyes' }, at: days(-31, 9) },
    { actor: alex, type: 'project.created', entityType: 'project', entityId: marketing._id, meta: { name: 'Q4 Marketing Campaign' }, at: days(-22, 10) },
    { actor: sofia, type: 'task.completed', entityType: 'task', entityId: tasks[15]._id, meta: { title: 'Analyze campaign metrics from Q3', status: 'completed' }, at: days(-5, 15) },
    { actor: priya, type: 'comment.added', entityType: 'task', entityId: tasks[2]._id, meta: { title: 'Design homepage hero mockups' }, at: days(-2, 16) },
    { actor: alex, type: 'member.invited', entityType: 'member', meta: { email: 'sofia@taskflow.app' }, at: days(-32, 9) },
    { actor: daniel, type: 'task.updated', entityType: 'task', entityId: tasks[7]._id, meta: { title: 'Set up Stripe subscription payments', status: 'in_progress', previousStatus: 'todo' }, at: days(-2, 11) },
    { actor: priya, type: 'project.updated', entityType: 'project', entityId: mobile._id, meta: { name: 'Mobile App v2.0' }, at: days(-9, 13) },
    { actor: sofia, type: 'task.created', entityType: 'task', entityId: tasks[13]._id, meta: { title: 'Plan Q4 social media calendar' }, at: days(-7, 9) },
    { actor: alex, type: 'task.updated', entityType: 'task', entityId: tasks[13]._id, meta: { title: 'Record product demo video', status: 'in_progress', previousStatus: 'todo' }, at: days(-1, 10) },
  ];
  for (const a of activitySpec) {
    await Activity.create({
      workspace: northwind._id,
      actor: a.actor._id,
      type: a.type,
      entityType: a.entityType,
      entityId: a.entityId,
      meta: a.meta,
      createdAt: a.at,
      updatedAt: a.at,
    });
  }

  // ------------------------------------------------------------ notifications
  await Notification.create([
    {
      user: alex._id, workspace: northwind._id, type: 'assignment',
      title: 'Sofia Reyes assigned you a task',
      body: 'Record product demo video',
      link: { kind: 'task', id: tasks[13]._id },
      read: false, createdAt: days(-1, 10),
    },
    {
      user: alex._id, workspace: northwind._id, type: 'comment',
      title: 'Daniel Kim commented on “Set up Stripe subscription payments”',
      body: 'On it. Checkout session endpoint is done, finishing webhooks today.',
      link: { kind: 'task', id: tasks[7]._id },
      read: false, createdAt: days(-3, 11),
    },
    {
      user: alex._id, workspace: northwind._id, type: 'deadline',
      title: 'Due soon: “Record product demo video”',
      body: 'In Q4 Marketing Campaign',
      link: { kind: 'task', id: tasks[13]._id },
      read: false, createdAt: days(0, 8),
    },
    {
      user: alex._id, workspace: northwind._id, type: 'completion',
      title: 'Sofia Reyes completed “Analyze campaign metrics from Q3”',
      link: { kind: 'task', id: tasks[15]._id },
      read: true, readAt: days(-4, 9), createdAt: days(-5, 15),
    },
  ]);

  // ------------------------------------------------------------------ summary
  console.log(`
[seed] Done. Created:
  - 4 users, 2 workspaces, 4 projects, ${tasks.length} tasks, ${commentsSpec.length} comments
  - ${activitySpec.length} activity records, 4 notifications

Demo login: alex@taskflow.app / ${PASSWORD}
Teammates:  priya@taskflow.app, daniel@taskflow.app, sofia@taskflow.app (same password)
`);
  await disconnectDB();
}

main().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
