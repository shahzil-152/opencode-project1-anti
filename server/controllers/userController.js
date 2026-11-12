const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const ApiError = require('../utils/apiError');
const User = require('../models/User');
const WorkspaceMember = require('../models/WorkspaceMember');
const { removeAvatarFile } = require('../middleware/upload');
const { cascadeDeleteWorkspace } = require('../services/workspaceService');
const { TOKEN_COOKIE, authCookieOptions } = require('../utils/cookies');

/** PATCH /api/users/me - profile fields */
async function updateProfile(req, res, next) {
  try {
    const { name, email } = req.body;

    if (email && email !== req.user.email) {
      const existing = await User.findOne({ email });
      if (existing) throw ApiError.conflict('An account with that email already exists');
      req.user.email = email;
    }
    if (name !== undefined) req.user.name = name;

    await req.user.save();
    res.json({ user: req.user.toPublic() });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/users/me/password */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const ok = await user.comparePassword(currentPassword);
    if (!ok) throw ApiError.badRequest('Current password is incorrect');

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    // Invalidate the existing session - sign in again with the new password.
    res.clearCookie(TOKEN_COOKIE, { ...authCookieOptions(), maxAge: 0 });
    res.json({ message: 'Password updated. Please sign in again.' });
  } catch (err) {
    next(err);
  }
}

/** POST /api/users/me/avatar (multipart field: image) */
async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) throw ApiError.badRequest('No image file was uploaded');

    removeAvatarFile(req.user.avatarUrl); // clean up the previous file
    req.user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await req.user.save();

    res.json({ user: req.user.toPublic() });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/users/me/preferences - theme + notification toggles */
async function updatePreferences(req, res, next) {
  try {
    const { theme, notifications } = req.body;

    if (theme && ['light', 'dark', 'system'].includes(theme)) {
      req.user.preferences.theme = theme;
    }
    if (notifications && typeof notifications === 'object') {
      for (const key of ['assignments', 'comments', 'deadlines']) {
        if (typeof notifications[key] === 'boolean') {
          req.user.preferences.notifications[key] = notifications[key];
        }
      }
    }

    await req.user.save();
    res.json({ user: req.user.toPublic() });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/users/me
 * Solo workspaces are deleted with all their content. Workspaces with other
 * members must be handed over first - we never destroy other people's data.
 */
async function deleteAccount(req, res, next) {
  try {
    const memberships = await WorkspaceMember.find({ user: req.user._id }).populate('workspace', 'name owner');

    const owned = memberships.filter((m) => m.role === 'owner');
    for (const m of owned) {
      const memberCount = await WorkspaceMember.countDocuments({ workspace: m.workspace._id });
      if (memberCount > 1) {
        throw ApiError.badRequest(
          `You own the workspace “${m.workspace.name}” which has other members. Transfer ownership or remove them first.`
        );
      }
      await cascadeDeleteWorkspace(m.workspace._id);
    }

    // Leave any other workspaces, then soft-delete the account so historical
    // tasks and comments keep a readable author.
    await WorkspaceMember.deleteMany({ user: req.user._id });
    await require('../models/Notification').deleteMany({ user: req.user._id });
    await require('../models/Invitation').deleteMany({ email: req.user.email, status: 'pending' });

    req.user.isDeleted = true;
    req.user.name = 'Deleted User';
    req.user.email = `deleted+${req.user._id}@taskflow.invalid`;
    req.user.password = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
    req.user.avatarUrl = null;
    await req.user.save();

    res.clearCookie(TOKEN_COOKIE, { ...authCookieOptions(), maxAge: 0 });
    res.json({ message: 'Account deleted. Sorry to see you go.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { updateProfile, changePassword, uploadAvatar, updatePreferences, deleteAccount };
