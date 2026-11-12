const mongoose = require('mongoose');
const config = require('./env');

/**
 * Atlas URIs sometimes omit the database name, which would scatter
 * collections across the cluster's admin database. Default to "taskflow".
 */
function ensureDatabaseName(uri) {
  const withoutQuery = uri.split('?')[0];
  const afterHost = withoutQuery.replace(/^[a-z+]+:\/\/[^/]+/i, '');
  const hasDatabase = afterHost && afterHost !== '/' && afterHost.length > 1;
  if (hasDatabase) return uri;
  return uri.endsWith('/') ? `${uri}taskflow` : `${uri}/taskflow`;
}

async function connectDB() {
  mongoose.set('strictQuery', true);
  const uri = ensureDatabaseName(config.mongoUri);
  await mongoose.connect(uri);
  console.log(`[db] MongoDB connected -> ${mongoose.connection.name}`);
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB, ensureDatabaseName };
