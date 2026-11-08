const express = require('express');
const HttpError = require('../utils/HttpError');
const { validateBookBody, parseId, parseListQuery } = require('../utils/validators');
const { buildListQuery } = require('../utils/queryBuilder');

// Express 4 does not catch rejected promises on its own, so wrap async handlers.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function booksRouter(db) {
  const router = express.Router();

  // GET /books -> list with search, price filter, sorting, pagination
  router.get(
    '/',
    wrap(async (req, res) => {
      const options = parseListQuery(req.query);
      const { sql, params, countSql, countParams } = buildListQuery(options);

      const { total } = await db.get(countSql, countParams);
      const books = await db.all(sql, params);

      res.status(200).json({
        total,
        limit: options.limit,
        offset: options.offset,
        count: books.length,
        data: books,
      });
    })
  );

  // GET /books/:id -> one book
  router.get(
    '/:id',
    wrap(async (req, res) => {
      const id = parseId(req.params.id);
      const book = await db.get('SELECT * FROM books WHERE id = ?', [id]);
      if (!book) throw new HttpError(404, `Book with id ${id} not found`);
      res.status(200).json({ data: book });
    })
  );

  // POST /books -> create
  router.post(
    '/',
    wrap(async (req, res) => {
      const { title, author, price } = validateBookBody(req.body);
      const result = await db.run('INSERT INTO books (title, author, price) VALUES (?, ?, ?)', [
        title,
        author,
        price,
      ]);
      const book = await db.get('SELECT * FROM books WHERE id = ?', [result.lastID]);
      res.status(201).location(`/books/${book.id}`).json({ message: 'Book created successfully', data: book });
    })
  );

  // PUT /books/:id -> full update
  router.put(
    '/:id',
    wrap(async (req, res) => {
      const id = parseId(req.params.id);
      const { title, author, price } = validateBookBody(req.body);

      const result = await db.run('UPDATE books SET title = ?, author = ?, price = ? WHERE id = ?', [
        title,
        author,
        price,
        id,
      ]);
      if (result.changes === 0) throw new HttpError(404, `Book with id ${id} not found`);

      const book = await db.get('SELECT * FROM books WHERE id = ?', [id]);
      res.status(200).json({ message: 'Book updated successfully', data: book });
    })
  );

  // DELETE /books/:id
  router.delete(
    '/:id',
    wrap(async (req, res) => {
      const id = parseId(req.params.id);
      const result = await db.run('DELETE FROM books WHERE id = ?', [id]);
      if (result.changes === 0) throw new HttpError(404, `Book with id ${id} not found`);
      res.status(200).json({ message: 'Book deleted successfully' });
    })
  );

  return router;
}

module.exports = booksRouter;
