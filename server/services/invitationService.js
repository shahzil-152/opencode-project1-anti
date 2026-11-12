const crypto = require('crypto');
const ApiError = require('../utils/apiError');
const Invitation = require('../models/Invitation');
const WorkspaceMember = require('../models/WorkspaceMember');
const { notify } = require('./notificationService');
const { logActivity } = require('./activityService');

/**
 * Creates a pending invitation. If the email belongs to an existing user we
 * also drop a notification into their inbox.
 */
async function createInvitation({ workspace, actor, email, role }) {
  // Reject emails that already belong to a member of this workspace.
  const User = require('../models/User');
  const inviteeUser = await User.findOne({ email, isDeleted: { $ne: true } }).select('_id');
  if (inviteeUser && (await WorkspaceMember.exists({ workspace: workspace._id, user: inviteeUser._id }))) {
    throw ApiError.badRequest('That person is already a member of this workspace');
  }

  // Reuse a still-pending invitation instead of stacking duplicates.
  const existing = await Invitation.findOne({
    workspace: workspace._id,
    email,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  });
  if (existing) return existing;

  const invitation = await Invitation.create({
    workspace: workspace._id,
    email,
    role,
    invitedBy: actor._id,
    token: crypto.randomBytes(24).toString('hex'),
  });

  if (inviteeUser) {
    await notify({
      userId: inviteeUser._id,
      workspaceId: workspace._id,
      type: 'invitation',
      title: `${actor.name} invited you to ${workspace.name}`,
      body: `You've been invited as ${role === 'admin' ? 'an admin' : 'a member'}.`,
      link: { kind: 'workspace', id: workspace._id },
      actorId: actor._id,
    });
  }

  await logActivity({
    workspaceId: workspace._id,
    actorId: actor._id,
    type: 'member.invited',
    entityType: 'member',
    meta: { email, workspaceName: workspace.name },
  });

  return invitation;
}

async function listPendingInvitations(workspaceId) {
  return Invitation.find({ workspace: workspaceId, status: 'pending', expiresAt: { $gt: new Date() } })
    .populate('invitedBy', 'name')
    .sort({ createdAt: -1 });
}

async function revokeInvitation({ workspaceId, invitationId }) {
  const invitation = await Invitation.findOne({ _id: invitationId, workspace: workspaceId });
  if (!invitation) throw ApiError.notFound('Invitation not found');
  if (invitation.status !== 'pending') throw ApiError.badRequest('Invitation is no longer pending');
  invitation.status = 'revoked';
  await invitation.save();
  return invitation;
}

/** Public lookup for the invite landing page. */
async function getInvitationByToken(token) {
  const invitation = await Invitation.findOne({ token })
    .populate('workspace', 'name')
    .populate('invitedBy', 'name avatarUrl');
  if (!invitation) throw ApiError.notFound('This invitation link is not valid');
  if (invitation.status !== 'pending') {
    throw ApiError.badRequest(`This invitation has been ${invitation.status}`);
  }
  if (invitation.isExpired()) throw ApiError.badRequest('This invitation has expired');
  return invitation;
}

/**
 * Accepts an invitation for the logged-in user. The account email must match
 * the invited email so invites can't be forwarded to someone else.
 */
async function acceptInvitation({ token, user }) {
  const invitation = await getInvitationByToken(token);

  if (invitation.email !== user.email) {
    throw ApiError.forbidden(
      `This invitation was sent to ${invitation.email}, but you're signed in as ${user.email}`
    );
  }

  const alreadyMember = await WorkspaceMember.findOne({
    workspace: invitation.workspace._id,
    user: user._id,
  });
  if (alreadyMember) {
    invitation.status = 'accepted';
    await invitation.save();
    return { workspace: invitation.workspace, alreadyMember: true };
  }

  await WorkspaceMember.create({
    workspace: invitation.workspace._id,
    user: user._id,
    role: invitation.role,
  });
  invitation.status = 'accepted';
  await invitation.save();

  await logActivity({
    workspaceId: invitation.workspace._id,
    actorId: user._id,
    type: 'member.joined',
    entityType: 'member',
    meta: { name: user.name, workspaceName: invitation.workspace.name },
  });

  return { workspace: invitation.workspace, alreadyMember: false };
}

module.exports = {
  createInvitation,
  listPendingInvitations,
  revokeInvitation,
  getInvitationByToken,
  acceptInvitation,
};
