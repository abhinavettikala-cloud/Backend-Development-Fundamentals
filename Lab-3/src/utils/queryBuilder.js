/**
 * Builds the parameterised SQL for GET /books.
 * User values only ever go into `params` (never into the SQL string).
 * order_by / order are identifiers, which cannot be parameterised, so they come
 * from a whitelist in validators.parseListQuery before reaching here.
 */
function escapeLike(text) {
  return text.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

function buildListQuery({ search_q, order_by, order, limit, offset, min_price, max_price }) {
  const where = [];
  const params = [];

  if (search_q) {
    where.push("title LIKE ? ESCAPE '\\'");
    params.push(`%${escapeLike(search_q)}%`);
  }
  if (min_price !== undefined && max_price !== undefined) {
    where.push('price BETWEEN ? AND ?');
    params.push(min_price, max_price);
  } else if (min_price !== undefined) {
    where.push('price >= ?');
    params.push(min_price);
  } else if (max_price !== undefined) {
    where.push('price <= ?');
    params.push(max_price);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  return {
    countSql: `SELECT COUNT(*) AS total FROM books ${whereSql}`,
    countParams: params,
    // secondary sort on id keeps pagination stable when values tie
    sql: `SELECT id, title, author, price, created_at FROM books ${whereSql} ORDER BY ${order_by} ${order}, id ASC LIMIT ? OFFSET ?`,
    params: [...params, limit, offset],
  };
}

module.exports = { buildListQuery, escapeLike };
