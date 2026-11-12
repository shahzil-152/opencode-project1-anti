const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy server/.env.example to server/.env and fill it in.`
    );
  }
  return value;
}

function optional(name, fallback) {
  return process.env[name] ?? fallback;
}

const config = {
  env: optional('NODE_ENV', 'development'),
  isProd: process.env.NODE_ENV === 'production',
  port: parseInt(optional('PORT', '5000'), 10),
  mongoUri: required('MONGO_URI'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: optional('JWT_EXPIRES_IN', '7d'),
  // Origin allowed to call the API with credentials (the browser client).
  clientUrl: optional('CLIENT_URL', 'http://localhost:5173'),
};

module.exports = config;
