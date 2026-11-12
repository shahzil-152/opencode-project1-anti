const Task = require('../models/Task');
const Comment = require('../models/Comment');
const ApiError = require('../utils/apiError');
const { escapeRegex } = require('../utils/regex');
const { parsePagination, paginated } = require('../utils/pagination');
const { logActivity } = require('./activityService');
const { notify } = require('./notificationService');

const STATUS_LABELS = {
  backlog: 'Backlog',
  todo: 'Todo',
  in_progress: 'In Progress',
  review: 'In Review',
  completed: 'Completed',
};

/** Builds the Mongo filter for task list/search endpoints. */
function buildTaskFilter(query) {
  const filter = { workspace: query.workspace };

  if (query.project && query.project !== 'all') {
    filter.project = query.project === 'none' ? null : query.project;
  }
  if (query.status && query.status !== 'all') filter.status = query.status;
  if (query.priority && query.priority !== 'all') filter.priority = query.priority;
  if (query.assignee && query.assignee !== 'all') {
    filter.assignee = query.assignee === 'unassigned' ? null : query.assignee;
  }
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ title: rx }, { description: rx }, { labels: rx }];
  }

  // Due-date windows ("today", "week", "overdue", "upcoming")
  if (query.due && query.due !== 'any') {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

    if (query.due === 'overdue') {
      filter.dueDate = { $lt: startOfDay };
      filter.status = { $ne: 'completed' };
    } else if (query.due === 'today') {
      filter.dueDate = { $gte: startOfDay, $lte: endOfDay };
    } else if (query.due === 'week') {
      const endOfWeek = new Date(startOfDay.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      filter.dueDate = { $gte: startOfDay, $lte: endOfWeek };
    } else if (query.due === 'none') {
      filter.dueDate = null;
    }
  }

  return filter;
}

const SORTS = {
  due: { dueDate: 1, position: 1 },
  '-due': { dueDate: -1, position: 1 },
  priority: { priority: 1, position: 1 },
  '-priority': { priority: -1, position: 1 },
  created: { createdAt: 1 },
  '-created': { createdAt: -1 },
  title: { title: 1 },
  '-title': { title: -1 },
  status: { status: 1, position: 1 },
  updated: { updatedAt: -1 },
};

async function listTasks(query) {
  const filter = buildTaskFilter(query);
  const sort = SORTS[query.sort] || SORTS['-created'];

  // The board and calendar need full result sets.
  if (query.view === 'board' || query.view === 'calendar') {
    const tasks = await Task.find(filter)
      .sort(sort)
      .limit(500)
      .populate('assignee', 'name avatarUrl')
      .populate('creator', 'name avatarUrl')
      .populate('project', 'name color');
    return { ...paginated(tasks, { page: 1, limit: tasks.length, total: tasks.length }), filterCount: tasks.length };
  }

  const { page, limit, skip } = parsePagination(query, { defaultLimit: 25 });
  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('assignee', 'name avatarUrl')
      .populate('creator', 'name avatarUrl')
      .populate('project', 'name color'),
    Task.countDocuments(filter),
  ]);
  return paginated(tasks, { page, limit, total });
}

/** Next position at the end of a status column. */
async function nextPosition(workspaceId, status) {
  const last = await Task.findOne({ workspace: workspaceId, status })
    .sort({ position: -1 })
    .select('position');
  return last ? last.position + 100 : 0;
}

async function createTask({ user, workspaceId, data }) {
  const task = await Task.create({
    ...data,
    workspace: workspaceId,
    creator: user._id,
    position: await nextPosition(workspaceId, data.status || 'todo'),
    completedAt: data.status === 'completed' ? new Date() : null,
  });

  await logActivity({
    workspaceId,
    actorId: user._id,
    type: 'task.created',
    entityType: 'task',
    entityId: task._id,
    meta: { title: task.title },
  });

  if (task.assignee) {
    await notify({
      userId: task.assignee,
      workspaceId,
      type: 'assignment',
      title: `${user.name} assigned you a task`,
      body: task.title,
      link: { kind: 'task', id: task._id },
      actorId: user._id,
    });
  }

  return task;
}

/**
 * Single place that applies task updates so status transitions, notifications
 * and activity logging stay consistent across PATCH and board reorder.
 */
async function applyTaskUpdate({ task, user, changes }) {
  const before = {
    status: task.status,
    assignee: task.assignee ? String(task.assignee) : null,
    title: task.title,
  };

  Object.assign(task, changes);

  // Status transitions maintain completedAt.
  if (changes.status && changes.status !== before.status) {
    task.completedAt = changes.status === 'completed' ? new Date() : null;
  }
  if (changes.status === 'completed' && !task.completedAt) task.completedAt = new Date();

  await task.save();

  // Activity + notifications for the transitions users care about.
  if (changes.status && changes.status !== before.status) {
    await logActivity({
      workspaceId: task.workspace,
      actorId: user._id,
      type: changes.status === 'completed' ? 'task.completed' : 'task.updated',
      entityType: 'task',
      entityId: task._id,
      meta: { title: task.title, status: changes.status, previousStatus: before.status },
    });

    if (changes.status === 'completed') {
      // Tell the creator their task got done (unless they did it themselves).
      await notify({
        userId: task.creator,
        workspaceId: task.workspace,
        type: 'completion',
        title: `${user.name} completed “${task.title}”`,
        body: '',
        link: { kind: 'task', id: task._id },
        actorId: user._id,
      });
    }
  }

  if (changes.assignee !== undefined && String(changes.assignee || null) !== before.assignee) {
    const Project = require('../models/Project');
    const project = task.project ? await Project.findById(task.project).select('name') : null;
    await notify({
      userId: task.assignee,
      workspaceId: task.workspace,
      type: 'assignment',
      title: `${user.name} assigned you a task${project ? ` in ${project.name}` : ''}`,
      body: task.title,
      link: { kind: 'task', id: task._id },
      actorId: user._id,
    });
  }

  if (!changes.status && changes.title && changes.title !== before.title) {
    await logActivity({
      workspaceId: task.workspace,
      actorId: user._id,
      type: 'task.updated',
      entityType: 'task',
      entityId: task._id,
      meta: { title: changes.title, previousTitle: before.title },
    });
  }

  return task;
}

async function updateTaskById({ taskId, user, changes }) {
  const Task = require('../models/Task');
  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');
  return applyTaskUpdate({ task, user, changes });
}

/** Bulk (status, position) updates coming from the Kanban board. */
async function reorderTasks({ workspaceId, user, updates }) {
  const ops = updates.map((u) => ({
    updateOne: {
      filter: { _id: u.id, workspace: workspaceId },
      update: {
        $set: {
          status: u.status,
          position: u.position,
          // Kanban completion sets completedAt; leaving a completed column clears it.
          ...(u.status === 'completed' ? { completedAt: u.completedAt || new Date() } : {}),
        },
      },
    },
  }));
  if (ops.length === 0) return;

  await Task.bulkWrite(ops, { ordered: false });

  // Log + notify for tasks whose status actually changed.
  const beforeIds = updates.filter((u) => u.previousStatus && u.previousStatus !== u.status).map((u) => u.id);
  if (beforeIds.length > 0) {
    const affected = await Task.find({ _id: { $in: beforeIds } }).populate('assignee', 'name');
    for (const task of affected) {
      const prev = updates.find((u) => String(u.id) === String(task._id))?.previousStatus;
      await applyTransitionSideEffects({ task, user, previousStatus: prev });
    }
  }
}

/** Activity + notification side effects for reorder-driven status changes. */
async function applyTransitionSideEffects({ task, user, previousStatus }) {
  if (!previousStatus) return;
  await logActivity({
    workspaceId: task.workspace,
    actorId: user._id,
    type: task.status === 'completed' ? 'task.completed' : 'task.updated',
    entityType: 'task',
    entityId: task._id,
    meta: { title: task.title, status: task.status, previousStatus },
  });
  if (task.status === 'completed') {
    await notify({
      userId: task.creator,
      workspaceId: task.workspace,
      type: 'completion',
      title: `${user.name} completed “${task.title}”`,
      link: { kind: 'task', id: task._id },
      actorId: user._id,
    });
  }
}

async function deleteTaskById({ task, user }) {
  await Comment.deleteMany({ task: task._id });
  await task.deleteOne();
  await logActivity({
    workspaceId: task.workspace,
    actorId: user._id,
    type: 'task.deleted',
    entityType: 'task',
    meta: { title: task.title },
  });
}

/** Subtasks live inside the task document. */
async function addSubtask({ task, title }) {
  task.subtasks.push({ title });
  await task.save();
  return task.subtasks[task.subtasks.length - 1];
}

async function updateSubtask({ task, subtaskId, changes }) {
  const sub = task.subtasks.id(subtaskId);
  if (!sub) throw ApiError.notFound('Subtask not found');
  if (changes.title !== undefined) sub.title = changes.title;
  if (changes.completed !== undefined) sub.completed = changes.completed;
  await task.save();
  return sub;
}

async function removeSubtask({ task, subtaskId }) {
  const sub = task.subtasks.id(subtaskId);
  if (!sub) throw ApiError.notFound('Subtask not found');
  task.subtasks.pull({ _id: subtaskId });
  await task.save();
}

async function addComment({ task, user, body }) {
  const comment = await Comment.create({ task: task._id, author: user._id, body });

  // Notify the assignee and the creator (excluding the commenter).
  const recipients = new Set();
  if (task.assignee) recipients.add(String(task.assignee));
  if (task.creator) recipients.add(String(task.creator));
  recipients.delete(String(user._id));

  for (const recipient of recipients) {
    await notify({
      userId: recipient,
      workspaceId: task.workspace,
      type: 'comment',
      title: `${user.name} commented on “${task.title}”`,
      body: body.slice(0, 120),
      link: { kind: 'task', id: task._id },
      actorId: user._id,
    });
  }

  await logActivity({
    workspaceId: task.workspace,
    actorId: user._id,
    type: 'comment.added',
    entityType: 'task',
    entityId: task._id,
    meta: { title: task.title },
  });

  return comment;
}

module.exports = {
  listTasks,
  createTask,
  updateTaskById,
  reorderTasks,
  deleteTaskById,
  addSubtask,
  updateSubtask,
  removeSubtask,
  addComment,
  nextPosition,
  STATUS_LABELS,
};
