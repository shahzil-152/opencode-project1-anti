const config = require('../config/env');

const TOKEN_COOKIE = 'taskflow_token';
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function authCookieOptions() {
  return {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE_MS,
    path: '/',
  };
}

module.exports = { TOKEN_COOKIE, TOKEN_MAX_AGE_MS, authCookieOptions };
