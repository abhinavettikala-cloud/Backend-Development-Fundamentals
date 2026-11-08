const fs = require('fs');
const path = require('path');

// Load .env for local development (Node 20.12+ / 22). Hosting platforms inject real env vars.
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envFile);
}

const createApp = require('./app');
const { initDb, seedIfEmpty } = require('./db');

const PORT = Number(process.env.PORT) || 3000;

async function main() {
  const db = await initDb();

  if (process.env.SEED_ON_START === 'true') {
    const inserted = await seedIfEmpty(db);
    if (inserted) console.log(`Seeded ${inserted} sample books`);
  }

  const app = createApp(db);
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });

  // Debugging exercise: port already in use (EADDRINUSE)
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the other process or set a different PORT.`);
    } else {
      console.error('Server error:', err);
    }
    process.exit(1);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await db.close();
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
