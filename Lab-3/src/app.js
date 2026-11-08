const express = require('express');
const booksRouter = require('./routes/books');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

function createApp(db) {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.get('/', (req, res) => {
    res.status(200).json({
      message: 'Lab 3 Books API is running',
      endpoints: [
        'GET /health',
        'GET /books',
        'GET /books/:id',
        'POST /books',
        'PUT /books/:id',
        'DELETE /books/:id',
      ],
    });
  });

  // Used by Render / Docker health checks
  app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

  app.use('/books', booksRouter(db));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
