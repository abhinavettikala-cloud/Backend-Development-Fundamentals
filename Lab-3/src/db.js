const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const SAMPLE_BOOKS = [
  ['Clean Code', 'Robert C. Martin', 499.0],
  ['The Pragmatic Programmer', 'Andrew Hunt', 599.5],
  ['Eloquent JavaScript', 'Marijn Haverbeke', 350.0],
  ["You Don't Know JS", 'Kyle Simpson', 299.0],
  ['Python Crash Course', 'Eric Matthes', 450.0],
  ['Node.js Design Patterns', 'Mario Casciaro', 799.0],
  ['Learning SQL', 'Alan Beaulieu', 450.0],
  ['Designing Data-Intensive Applications', 'Martin Kleppmann', 899.0],
  ['JavaScript: The Good Parts', 'Douglas Crockford', 250.0],
];

async function initDb(dbPath = process.env.DB_PATH || './data/books.db') {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
  }

  const db = await open({ filename: dbPath, driver: sqlite3.Database });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT    NOT NULL,
      author     TEXT    NOT NULL,
      price      REAL    NOT NULL CHECK (price >= 0),
      created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return db;
}

async function seedIfEmpty(db) {
  const { count } = await db.get('SELECT COUNT(*) AS count FROM books');
  if (count > 0) return 0;

  for (const [title, author, price] of SAMPLE_BOOKS) {
    await db.run('INSERT INTO books (title, author, price) VALUES (?, ?, ?)', [title, author, price]);
  }
  return SAMPLE_BOOKS.length;
}

module.exports = { initDb, seedIfEmpty };
