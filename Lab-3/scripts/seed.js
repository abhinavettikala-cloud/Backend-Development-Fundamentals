const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envFile);
}

const { initDb, seedIfEmpty } = require('../src/db');

(async () => {
  const db = await initDb();
  const inserted = await seedIfEmpty(db);
  console.log(inserted ? `Inserted ${inserted} sample books` : 'Table already has data, nothing inserted');
  await db.close();
})();
