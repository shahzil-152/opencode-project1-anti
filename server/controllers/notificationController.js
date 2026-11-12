const Notification = require('../models/Notification');
const Task = require('../models/Task');
const WorkspaceMember = require('../models/WorkspaceMember');
const { notify } = require('../services/notificationService');
const { parsePagination, paginated } = require('../utils/pagination');

/**
 * Creates "due soon" notifications for tasks assigned to the user that are
 * due within the next 48 hours (and still open). Runs when the inbox is
 * opened - at most one notification per task.
 */
async function runDeadlineSweep(user) {
  try {
    if (user.preferences?.notifications?.deadlines === false) return;

    const workspaceIds = await WorkspaceMember.find({ user: user._id }).distinct('workspace');
    if (workspaceIds.length === 0) return;

    const now = new Date();
    const soon = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const recentlyOverdue = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const tasks = await Task.find({
      workspace: { $in: workspaceIds },
      assignee: user._id,
      status: { $ne: 'completed' },
      dueDate: { $ne: null, $gte: recentlyOverdue, $lte: soon },
    })
      .limit(20)
      .populate('project', 'name');

    for (const task of tasks) {
      const exists = await Notification.exists({
        user: user._id,
        type: 'deadline',
        'link.id': task._id,
      });
      if (exists) continue;

      await notify({
        userId: user._id,
        workspaceId: task.workspace,
        type: 'deadline',
        title: `Due soon: “${task.title}”`,
        body: task.project ? `In ${task.project.name}` : '',
        link: { kind: 'task', id: task._id },
      });
    }
  } catch (err) {
    console.error('[deadline-sweep] failed:', err.message);
  }
}

/** GET /api/notifications */
async function list(req, res, next) {
  try {
    await runDeadlineSweep(req.user);

    const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 30 });
    const filter = { user: req.user._id };
    if (req.query.unread === 'true') filter.read = false;

    const [notifications, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
    ]);
    res.json(paginated(notifications, { page, limit, total }));
  } catch (err) {
    next(err);
  }
}

/** GET /api/notifications/unread-count */
async function unreadCount(req, res, next) {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ count });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/notifications/:id/read */
async function markRead(req, res, next) {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    notification.read = true;
    notification.readAt = new Date();
    await notification.save();
    res.json({ notification });
  } catch (err) {
    next(err);
  }
}

/** POST /api/notifications/read-all */
async function markAllRead(req, res, next) {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, unreadCount, markRead, markAllRead };
