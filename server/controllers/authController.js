const bcrypt = require('bcryptjs');
const ApiError = require('../utils/apiError');
const User = require('../models/User');
const { signAuthToken } = require('../utils/jwt');
const { TOKEN_COOKIE, authCookieOptions, TOKEN_MAX_AGE_MS } = require('../utils/cookies');
const { createWorkspaceForUser, listWorkspacesForUser } = require('../services/workspaceService');

function setAuthCookie(res, token) {
  res.cookie(TOKEN_COOKIE, token, authCookieOptions());
}

/** POST /api/auth/register */
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) throw ApiError.conflict('An account with that email already exists');

    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
    });

    // Everyone starts with their own workspace they can invite a team into.
    const workspace = await createWorkspaceForUser({
      user,
      name: `${name.split(' ')[0]}'s Workspace`,
    });

    setAuthCookie(res, signAuthToken(user._id));
    res.status(201).json({ user: user.toPublic(), workspace });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/login */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || user.isDeleted) throw ApiError.unauthorized('Invalid email or password');

    const ok = await user.comparePassword(password);
    if (!ok) throw ApiError.unauthorized('Invalid email or password');

    setAuthCookie(res, signAuthToken(user._id));
    const workspaces = await listWorkspacesForUser(user._id);
    res.json({ user: user.toPublic(), workspaces });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/logout */
async function logout(_req, res) {
  res.clearCookie(TOKEN_COOKIE, { ...authCookieOptions(), maxAge: 0 });
  res.json({ message: 'Signed out' });
}

/** GET /api/auth/me - restores the session after a page refresh. */
async function me(req, res, next) {
  try {
    const workspaces = await listWorkspacesForUser(req.user._id);
    res.json({ user: req.user.toPublic(), workspaces });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, me };
