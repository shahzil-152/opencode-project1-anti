const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const app = require('./app');

async function main() {
  await connectDB();
  const server = app.listen(config.port, () => {
    console.log(`[api] TaskFlow API running on http://localhost:${config.port} (${config.env})`);
  });

  // Graceful shutdown so containers/process managers restart cleanly.
  const shutdown = async (signal) => {
    console.log(`\n[api] ${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[api] Failed to start:', err.message);
  process.exit(1);
});
