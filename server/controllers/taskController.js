const ApiError = require('../utils/apiError');
const Comment = require('../models/Comment');
const { loadTaskWithAccess } = require('../middleware/workspace');
const taskService = require('../services/taskService');

const POPULATE = [
  { path: 'assignee', select: 'name avatarUrl' },
  { path: 'creator', select: 'name avatarUrl' },
  { path: 'project', select: 'name color' },
];

function pickTaskFields(body) {
  const data = {};
  for (const key of ['title', 'description', 'status', 'priority', 'dueDate', 'project', 'assignee', 'labels']) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (data.dueDate === '') data.dueDate = null;
  if (data.project === '') data.project = null;
  if (data.assignee === '') data.assignee = null;
  return data;
}

/** GET /api/tasks?workspace=...&project=&status=&priority=&assignee=&due=&q=&sort=&page=&limit=&view= */
async function list(req, res, next) {
  try {
    const result = await taskService.listTasks({
      workspace: req.workspace._id,
      project: req.query.project,
      status: req.query.status,
      priority: req.query.priority,
      assignee: req.query.assignee,
      due: req.query.due,
      q: req.query.q,
      sort: req.query.sort,
      page: req.query.page,
      limit: req.query.limit,
      view: req.query.view,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/** POST /api/tasks */
async function create(req, res, next) {
  try {
    const task = await taskService.createTask({
      user: req.user,
      workspaceId: req.workspace._id,
      data: pickTaskFields(req.body),
    });
    await task.populate(POPULATE);
    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
}

/** GET /api/tasks/:id - full detail including comments */
async function get(req, res, next) {
  try {
    const { task } = await loadTaskWithAccess(req.params.id, req.user);
    await task.populate(POPULATE);
    const comments = await Comment.find({ task: task._id })
      .populate('author', 'name avatarUrl')
      .sort({ createdAt: 1 });
    res.json({ task, comments });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/tasks/:id */
async function update(req, res, next) {
  try {
    const task = await taskService.updateTaskById({
      taskId: req.params.id,
      user: req.user,
      changes: pickTaskFields(req.body),
    });
    await task.populate(POPULATE);
    res.json({ task });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/tasks/:id */
async function remove(req, res, next) {
  try {
    const { task } = await loadTaskWithAccess(req.params.id, req.user);
    await taskService.deleteTaskById({ task, user: req.user });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

/** PUT /api/tasks/reorder - Kanban drag & drop persistence */
async function reorder(req, res, next) {
  try {
    await taskService.reorderTasks({
      workspaceId: req.workspace._id,
      user: req.user,
      updates: req.body.updates,
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

/** POST /api/tasks/:id/comments */
async function addComment(req, res, next) {
  try {
    const { task } = await loadTaskWithAccess(req.params.id, req.user);
    const comment = await taskService.addComment({ task, user: req.user, body: req.body.body });
    await comment.populate('author', 'name avatarUrl');
    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
}

/** POST /api/tasks/:id/subtasks */
async function addSubtask(req, res, next) {
  try {
    const { task } = await loadTaskWithAccess(req.params.id, req.user);
    const subtask = await taskService.addSubtask({ task, title: req.body.title });
    res.status(201).json({ subtask });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/tasks/:id/subtasks/:subtaskId */
async function updateSubtask(req, res, next) {
  try {
    const { task } = await loadTaskWithAccess(req.params.id, req.user);
    const subtask = await taskService.updateSubtask({
      task,
      subtaskId: req.params.subtaskId,
      changes: req.body,
    });
    res.json({ subtask });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/tasks/:id/subtasks/:subtaskId */
async function removeSubtask(req, res, next) {
  try {
    const { task } = await loadTaskWithAccess(req.params.id, req.user);
    await taskService.removeSubtask({ task, subtaskId: req.params.subtaskId });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  create,
  get,
  update,
  remove,
  reorder,
  addComment,
  addSubtask,
  updateSubtask,
  removeSubtask,
};
