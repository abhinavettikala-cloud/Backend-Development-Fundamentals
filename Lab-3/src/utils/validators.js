const HttpError = require('./HttpError');

const ALLOWED_ORDER_BY = ['id', 'title', 'author', 'price'];
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function isBlankString(value) {
  return typeof value !== 'string' || value.trim() === '';
}

/** Accepts a number or a numeric string like "499.5". Returns NaN otherwise. */
function toNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return NaN;
}

/**
 * Validates a POST / PUT body. Returns a clean { title, author, price }
 * or throws HttpError(400) with a clear message.
 */
function validateBookBody(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Request body must be a JSON object');
  }

  const errors = [];

  if (isBlankString(body.title)) errors.push('title is required and must be a non-empty string');
  if (isBlankString(body.author)) errors.push('author is required and must be a non-empty string');

  const price = toNumber(body.price);
  if (body.price === undefined || body.price === null || body.price === '') {
    errors.push('price is required');
  } else if (!Number.isFinite(price)) {
    errors.push('price must be a number');
  } else if (price < 0) {
    errors.push('price must not be negative');
  }

  if (errors.length > 0) {
    throw new HttpError(400, errors.join('; '));
  }

  return { title: body.title.trim(), author: body.author.trim(), price };
}

/** Parses a path id. Non-integer or non-positive ids are a 400 (bad input). */
function parseId(raw) {
  if (!/^\d+$/.test(raw) || Number(raw) < 1) {
    throw new HttpError(400, 'id must be a positive integer');
  }
  return Number(raw);
}

function parseIntParam(name, raw, { min, max, fallback }) {
  if (raw === undefined || raw === '') return fallback;
  if (typeof raw !== 'string' || !/^-?\d+$/.test(raw)) {
    throw new HttpError(400, `${name} must be an integer`);
  }
  const n = Number(raw);
  if (n < min) throw new HttpError(400, `${name} must be at least ${min}`);
  if (max !== undefined && n > max) throw new HttpError(400, `${name} must be at most ${max}`);
  return n;
}

function parsePriceParam(name, raw) {
  if (raw === undefined || raw === '') return undefined;
  const n = toNumber(raw);
  if (!Number.isFinite(n)) throw new HttpError(400, `${name} must be a number`);
  return n;
}

/** Validates and normalises the GET /books query string (each param has a default). */
function parseListQuery(query) {
  const search_q = typeof query.search_q === 'string' ? query.search_q.trim() : '';

  const order_by = query.order_by === undefined || query.order_by === '' ? 'id' : query.order_by;
  if (!ALLOWED_ORDER_BY.includes(order_by)) {
    throw new HttpError(400, `order_by must be one of: ${ALLOWED_ORDER_BY.join(', ')}`);
  }

  const orderRaw = query.order === undefined || query.order === '' ? 'ASC' : String(query.order);
  const order = orderRaw.toUpperCase();
  if (order !== 'ASC' && order !== 'DESC') {
    throw new HttpError(400, 'order must be ASC or DESC');
  }

  const limit = parseIntParam('limit', query.limit, { min: 1, max: MAX_LIMIT, fallback: DEFAULT_LIMIT });
  const offset = parseIntParam('offset', query.offset, { min: 0, fallback: 0 });

  const min_price = parsePriceParam('min_price', query.min_price);
  const max_price = parsePriceParam('max_price', query.max_price);
  if (min_price !== undefined && max_price !== undefined && min_price > max_price) {
    throw new HttpError(400, 'min_price must not be greater than max_price');
  }

  return { search_q, order_by, order, limit, offset, min_price, max_price };
}

module.exports = {
  ALLOWED_ORDER_BY,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  validateBookBody,
  parseId,
  parseListQuery,
};
