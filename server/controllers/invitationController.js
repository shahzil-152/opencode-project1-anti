const { getInvitationByToken, acceptInvitation } = require('../services/invitationService');

/** GET /api/invitations/:token - public info for the invite landing page */
async function getByToken(req, res, next) {
  try {
    const invitation = await getInvitationByToken(req.params.token);
    res.json({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        workspace: invitation.workspace
          ? { id: invitation.workspace._id, name: invitation.workspace.name }
          : null,
        invitedBy: invitation.invitedBy ? invitation.invitedBy.name : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/invitations/:token/accept */
async function accept(req, res, next) {
  try {
    const { workspace, alreadyMember } = await acceptInvitation({
      token: req.params.token,
      user: req.user,
    });
    const message = alreadyMember
      ? `You're already part of ${workspace.name}`
      : `Welcome to ${workspace.name}!`;
    res.json({ workspace: { id: workspace._id, name: workspace.name }, message });
  } catch (err) {
    next(err);
  }
}

module.exports = { getByToken, accept };
