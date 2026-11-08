function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Malformed JSON body (thrown by express.json())
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body is not valid JSON' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large' });
  }
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ message: err.message });
  }

  console.error(err); // full detail stays in the server log only
  res.status(500).json({ message: 'Internal server error' });
}

module.exports = { notFoundHandler, errorHandler };
