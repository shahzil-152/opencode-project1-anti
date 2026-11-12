const ApiError = require('../utils/apiError');
const { TOKEN_COOKIE } = require('../utils/cookies');
const { verifyAuthToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Verifies the HTTP-only auth cookie and attaches req.user.
 * Must run on every protected route.
 */
async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[TOKEN_COOKIE];
    if (!token) throw ApiError.unauthorized();

    let payload;
    try {
      payload = verifyAuthToken(token);
    } catch {
      throw ApiError.unauthorized('Your session has expired, please sign in again');
    }

    const user = await User.findById(payload.sub);
    if (!user || user.isDeleted) throw ApiError.unauthorized('Account no longer exists');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth };
