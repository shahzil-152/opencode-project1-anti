const ApiError = require('../utils/apiError');
const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');
const Task = require('../models/Task');
const {
  createWorkspaceForUser,
  listWorkspacesForUser,
  cascadeDeleteWorkspace,
} = require('../services/workspaceService');
const {
  createInvitation,
  listPendingInvitations,
  revokeInvitation,
} = require('../services/invitationService');
const { logActivity } = require('../services/activityService');
const config = require('../config/env');

/** GET /api/workspaces */
async function list(req, res, next) {
  try {
    const workspaces = await listWorkspacesForUser(req.user._id);
    res.json({ data: workspaces });
  } catch (err) {
    next(err);
  }
}

/** POST /api/workspaces */
async function create(req, res, next) {
  try {
    const { name, description } = req.body;
    const workspace = await createWorkspaceForUser({ user: req.user, name, description });
    res.status(201).json({ workspace: { ...workspace.toObject(), role: 'owner' } });
  } catch (err) {
    next(err);
  }
}

/** GET /api/workspaces/:workspaceId */
async function get(req, res, next) {
  try {
    const members = await WorkspaceMember.find({ workspace: req.workspace._id })
      .populate('user', 'name email avatarUrl')
      .sort({ joinedAt: 1 });

    res.json({
      workspace: req.workspace,
      members: members.map((m) => ({
        id: m.user._id,
        name: m.user.name,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      membership: { role: req.membership.role },
    });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/workspaces/:workspaceId (admin+) */
async function update(req, res, next) {
  try {
    const { name, description } = req.body;
    if (name !== undefined) req.workspace.name = name;
    if (description !== undefined) req.workspace.description = description;
    await req.workspace.save();
    res.json({ workspace: req.workspace });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/workspaces/:workspaceId (owner) */
async function remove(req, res, next) {
  try {
    await cascadeDeleteWorkspace(req.workspace._id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

/** GET /api/workspaces/:workspaceId/members - with per-member task stats */
async function listMembers(req, res, next) {
  try {
    const members = await WorkspaceMember.find({ workspace: req.workspace._id })
      .populate('user', 'name email avatarUrl createdAt')
      .sort({ joinedAt: 1 });

    const stats = await Task.aggregate()
      .match({ workspace: req.workspace._id })
      .group({
        _id: '$assignee',
        open: { $sum: { $cond: [{ $ne: ['$status', 'completed'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        lastActivityAt: { $max: '$updatedAt' },
      });
    const statsByUser = new Map(stats.map((s) => [String(s._id), s]));

    res.json({
      data: members.map((m) => {
        const s = statsByUser.get(String(m.user._id)) || { open: 0, completed: 0, lastActivityAt: null };
        return {
          id: m.user._id,
          name: m.user.name,
          email: m.user.email,
          avatarUrl: m.user.avatarUrl,
          role: m.role,
          joinedAt: m.joinedAt,
          stats: { openTasks: s.open, completedTasks: s.completed, lastActivityAt: s.lastActivityAt },
        };
      }),
    });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/workspaces/:workspaceId/members/:userId (admin+) */
async function updateMember(req, res, next) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const target = await WorkspaceMember.findOne({ workspace: req.workspace._id, user: userId });
    if (!target) throw ApiError.notFound('Member not found');
    if (target.role === 'owner') {
      throw ApiError.forbidden('The workspace owner role cannot be changed');
    }

    target.role = role;
    await target.save();

    await logActivity({
      workspaceId: req.workspace._id,
      actorId: req.user._id,
      type: 'member.role_updated',
      entityType: 'member',
      entityId: userId,
      meta: { role },
    });

    res.json({ member: target });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/workspaces/:workspaceId/members/:userId (admin+ or self) */
async function removeMember(req, res, next) {
  try {
    const { userId } = req.params;
    const isSelf = String(userId) === String(req.user._id);

    const target = await WorkspaceMember.findOne({ workspace: req.workspace._id, user: userId });
    if (!target) throw ApiError.notFound('Member not found');
    if (target.role === 'owner') {
      throw ApiError.forbidden('The workspace owner cannot be removed');
    }
    if (!isSelf && !WorkspaceMember.roleAtLeast(req.membership.role, 'admin')) {
      throw ApiError.forbidden('Only admins can remove other members');
    }

    await target.deleteOne();
    await logActivity({
      workspaceId: req.workspace._id,
      actorId: req.user._id,
      type: isSelf ? 'member.left' : 'member.removed',
      entityType: 'member',
      entityId: userId,
      meta: { name: target.user?.name || '' },
    });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

/** POST /api/workspaces/:workspaceId/invitations (admin+) */
async function createInvitationHandler(req, res, next) {
  try {
    const { email, role = 'member' } = req.body;
    const invitation = await createInvitation({
      workspace: req.workspace,
      actor: req.user,
      email,
      role,
    });
    res.status(201).json({
      invitation,
      link: `${config.clientUrl}/invite/${invitation.token}`,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/workspaces/:workspaceId/invitations (admin+) */
async function listInvitations(req, res, next) {
  try {
    const invitations = await listPendingInvitations(req.workspace._id);
    res.json({
      data: invitations.map((i) => ({
        id: i._id,
        email: i.email,
        role: i.role,
        createdAt: i.createdAt,
        expiresAt: i.expiresAt,
        invitedBy: i.invitedBy,
        link: `${config.clientUrl}/invite/${i.token}`,
      })),
    });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/workspaces/:workspaceId/invitations/:invitationId (admin+) */
async function revokeInvitationHandler(req, res, next) {
  try {
    await revokeInvitation({ workspaceId: req.workspace._id, invitationId: req.params.invitationId });
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
  listMembers,
  updateMember,
  removeMember,
  createInvitationHandler,
  listInvitations,
  revokeInvitationHandler,
};
