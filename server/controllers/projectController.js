const ApiError = require('../utils/apiError');
const Project = require('../models/Project');
const Task = require('../models/Task');
const WorkspaceMember = require('../models/WorkspaceMember');
const { loadProjectWithAccess } = require('../middleware/workspace');
const { cascadeDeleteProject } = require('../services/workspaceService');
const { logActivity } = require('../services/activityService');

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** GET /api/projects?workspace=... */
async function list(req, res, next) {
  try {
    const projects = await Project.find({ workspace: req.workspace._id, archived: false })
      .populate('members', 'name avatarUrl')
      .sort({ createdAt: 1 });

    const stats = await Task.aggregate()
      .match({ workspace: req.workspace._id })
      .group({
        _id: '$project',
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        overdue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$status', 'completed'] },
                  { $ne: ['$dueDate', null] },
                  { $lt: ['$dueDate', startOfDay()] },
                ],
              },
              1,
              0,
            ],
          },
        },
      });
    const statsByProject = new Map(stats.map((s) => [String(s._id), s]));

    res.json({
      data: projects.map((p) => {
        const s = statsByProject.get(String(p._id)) || { total: 0, completed: 0, overdue: 0 };
        return {
          ...p.toObject(),
          total: s.total,
          completed: s.completed,
          overdue: s.overdue,
          progress: s.total === 0 ? 0 : Math.round((s.completed / s.total) * 100),
        };
      }),
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/projects */
async function create(req, res, next) {
  try {
    const { name, description = '', color, deadline, members = [] } = req.body;

    // Project members must be workspace members.
    const validMembers = await WorkspaceMember.find({
      workspace: req.workspace._id,
      user: { $in: members },
    }).distinct('user');

    const project = await Project.create({
      workspace: req.workspace._id,
      name,
      description,
      color: color || '#7C5CE0',
      deadline: deadline || null,
      members: validMembers,
      createdBy: req.user._id,
    });

    await logActivity({
      workspaceId: req.workspace._id,
      actorId: req.user._id,
      type: 'project.created',
      entityType: 'project',
      entityId: project._id,
      meta: { name: project.name },
    });

    await project.populate('members', 'name avatarUrl');
    res.status(201).json({ project: { ...project.toObject(), total: 0, completed: 0, overdue: 0, progress: 0 } });
  } catch (err) {
    next(err);
  }
}

/** GET /api/projects/:id - detail with live stats */
async function get(req, res, next) {
  try {
    const { project } = await loadProjectWithAccess(req.params.id, req.user);

    const [stats, tasks] = await Promise.all([
      Task.aggregate()
        .match({ project: project._id })
        .group({
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$status', 'completed'] }, { $ne: ['$dueDate', null] }, { $lt: ['$dueDate', startOfDay()] }] },
                1,
                0,
              ],
            },
          },
        })
        .then((rows) => rows[0] || { total: 0, completed: 0, inProgress: 0, overdue: 0 }),
      Task.find({ project: project._id }).countDocuments(),
    ]);

    await project.populate([
      { path: 'members', select: 'name avatarUrl email' },
      { path: 'createdBy', select: 'name avatarUrl' },
    ]);

    res.json({
      project: {
        ...project.toObject(),
        stats: {
          ...stats,
          progress: stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100),
        },
        taskCount: tasks,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/projects/:id (admin+) */
async function update(req, res, next) {
  try {
    const { project, membership } = await loadProjectWithAccess(req.params.id, req.user);
    if (!WorkspaceMember.roleAtLeast(membership.role, 'admin')) {
      throw ApiError.forbidden('Only workspace admins can edit projects');
    }

    const { name, description, color, deadline, members, archived } = req.body;
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (color !== undefined) project.color = color;
    if (deadline !== undefined) project.deadline = deadline || null;
    if (archived !== undefined) project.archived = archived;
    if (members !== undefined) {
      const validMembers = await WorkspaceMember.find({
        workspace: project.workspace,
        user: { $in: members },
      }).distinct('user');
      project.members = validMembers;
    }

    await project.save();
    await logActivity({
      workspaceId: project.workspace,
      actorId: req.user._id,
      type: 'project.updated',
      entityType: 'project',
      entityId: project._id,
      meta: { name: project.name },
    });

    await project.populate('members', 'name avatarUrl email');
    res.json({ project });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/projects/:id (admin+) - removes the project and its tasks */
async function remove(req, res, next) {
  try {
    const { project, membership } = await loadProjectWithAccess(req.params.id, req.user);
    if (!WorkspaceMember.roleAtLeast(membership.role, 'admin')) {
      throw ApiError.forbidden('Only workspace admins can delete projects');
    }

    await cascadeDeleteProject(project._id);
    await logActivity({
      workspaceId: project.workspace,
      actorId: req.user._id,
      type: 'project.deleted',
      entityType: 'project',
      meta: { name: project.name },
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, get, update, remove };
