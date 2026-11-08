// Runs with: npm test  (uses Node's built-in test runner, no extra packages)
const test = require('node:test');
const assert = require('node:assert');
const { validateBookBody, parseId, parseListQuery } = require('../src/utils/validators');
const { buildListQuery } = require('../src/utils/queryBuilder');

const status = (fn) => {
  try { fn(); return 200; } catch (e) { return e.status; }
};

test('POST body: valid book passes', () => {
  assert.deepStrictEqual(validateBookBody({ title: ' A ', author: 'B', price: '10.5' }), { title: 'A', author: 'B', price: 10.5 });
});

test('POST body: missing title / author / bad price -> 400', () => {
  assert.strictEqual(status(() => validateBookBody({ author: 'B', price: 1 })), 400);
  assert.strictEqual(status(() => validateBookBody({ title: 'A', price: 1 })), 400);
  assert.strictEqual(status(() => validateBookBody({ title: 'A', author: 'B', price: 'abc' })), 400);
  assert.strictEqual(status(() => validateBookBody({ title: 'A', author: 'B' })), 400);
  assert.strictEqual(status(() => validateBookBody({ title: 'A', author: 'B', price: -5 })), 400);
  assert.strictEqual(status(() => validateBookBody(null)), 400);
});

test('id parsing', () => {
  assert.strictEqual(parseId('7'), 7);
  assert.strictEqual(status(() => parseId('abc')), 400);
  assert.strictEqual(status(() => parseId('0')), 400);
});

test('list query defaults and validation', () => {
  const q = parseListQuery({});
  assert.deepStrictEqual([q.order_by, q.order, q.limit, q.offset], ['id', 'ASC', 10, 0]);
  assert.strictEqual(status(() => parseListQuery({ order_by: 'price; DROP TABLE books' })), 400);
  assert.strictEqual(status(() => parseListQuery({ order: 'sideways' })), 400);
  assert.strictEqual(status(() => parseListQuery({ limit: '0' })), 400);
  assert.strictEqual(status(() => parseListQuery({ limit: '1000' })), 400);
  assert.strictEqual(status(() => parseListQuery({ offset: '-1' })), 400);
  assert.strictEqual(status(() => parseListQuery({ min_price: 'x' })), 400);
  assert.strictEqual(status(() => parseListQuery({ min_price: '500', max_price: '100' })), 400);
});

test('SQL is parameterised (user input never in the SQL string)', () => {
  const evil = "'; DROP TABLE books; --";
  const { sql, params } = buildListQuery(parseListQuery({ search_q: evil, min_price: '1', max_price: '9' }));
  assert.ok(!sql.includes('DROP'));
  assert.ok(sql.includes('BETWEEN ? AND ?'));
  assert.ok(params.some((p) => String(p).includes('DROP')));
});

// Runs the generated SQL against a real SQLite engine when node:sqlite is available (Node 22+)
let DatabaseSync;
try { ({ DatabaseSync } = require('node:sqlite')); } catch (_) { /* older Node */ }

test('search + filter + sort + paging against SQLite', { skip: !DatabaseSync }, () => {
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE books (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, author TEXT, price REAL, created_at TEXT)');
  const ins = db.prepare('INSERT INTO books (title, author, price) VALUES (?, ?, ?)');
  [['JavaScript Basics', 'A', 100], ['Advanced JavaScript', 'B', 300], ['SQL 101', 'C', 200], ['100% Python', 'D', 400]].forEach((r) => ins.run(...r));

  const run = (qs) => {
    const b = buildListQuery(parseListQuery(qs));
    return { rows: db.prepare(b.sql).all(...b.params), total: db.prepare(b.countSql).get(...b.countParams).total };
  };

  let r = run({ search_q: 'javascript' });
  assert.strictEqual(r.total, 2);

  r = run({ min_price: '150', max_price: '350', order_by: 'price', order: 'desc' });
  assert.deepStrictEqual(r.rows.map((x) => x.price), [300, 200]);

  r = run({ order_by: 'title', limit: '2', offset: '1' });
  assert.strictEqual(r.rows.length, 2);
  assert.strictEqual(r.total, 4);

  r = run({ search_q: '%' }); // literal % must not act as a wildcard
  assert.strictEqual(r.total, 1);
});
