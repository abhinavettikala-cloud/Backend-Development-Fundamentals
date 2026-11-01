const express = require('express');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
let db;
app.use(express.json());

app.param('bookId', (req, res, next, value) => {
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1)
        return res.status(400).json({ error: 'Book ID must be a positive integer' });
    req.bookId = Number(value);
    next();
});
function validateBook(req, res, next) {
    const { title, author, price, pages } = req.body || {};
    if (typeof title !== 'string' || !title.trim() || typeof author !== 'string' || !author.trim() ||
        !Number.isSafeInteger(price) || price < 0 || !Number.isSafeInteger(pages) || pages < 1)
        return res.status(400).json({ error: 'Provide title, author, nonnegative integer price and positive integer pages' });
    req.book = [title.trim(), author.trim(), price, pages];
    next();
}
app.get('/books/', async (req, res) => {
    res.json(await db.all('SELECT * FROM book ORDER BY id'));
});
app.get('/books/:bookId/', async (req, res) => {
    const book = await db.get('SELECT * FROM book WHERE id = ?', req.bookId);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
});
app.post('/books/', validateBook, async (req, res) => {
    const result = await db.run('INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)', req.book);
    res.status(201).json(await db.get('SELECT * FROM book WHERE id = ?', result.lastID));
});
app.put('/books/:bookId/', validateBook, async (req, res) => {
    const result = await db.run('UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?', [...req.book, req.bookId]);
    if (!result.changes) return res.status(404).json({ error: 'Book not found' });
    res.json(await db.get('SELECT * FROM book WHERE id = ?', req.bookId));
});
app.delete('/books/:bookId/', async (req, res) => {
    const result = await db.run('DELETE FROM book WHERE id = ?', req.bookId);
    if (!result.changes) return res.status(404).json({ error: 'Book not found' });
    res.json({ message: 'Book deleted successfully' });
});
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error' });
});
async function initializeDBAndServer() {
    try {
        db = await open({ filename: path.join(__dirname, 'bookstore.db'), driver: sqlite3.Database });
        await db.get('SELECT id FROM book LIMIT 1');
        app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
    } catch (error) {
        console.error('Database initialization failed:', error.message);
        if (db) await db.close();
        process.exitCode = 1;
    }
}
initializeDBAndServer();
