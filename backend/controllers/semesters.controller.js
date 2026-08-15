const { pool } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, year FROM semesters ORDER BY year DESC, name ASC');
  res.json({ success: true, semesters: rows });
});

async function findOrCreateSemester(name, year, connection = pool) {
  if (!name || !year) return null;
  const trimmedName = String(name).trim();
  const numYear = Number(year);

  const [existing] = await connection.query(
    'SELECT id FROM semesters WHERE name = ? AND year = ? LIMIT 1',
    [trimmedName, numYear]
  );
  if (existing.length) return existing[0].id;

  const [result] = await connection.query(
    'INSERT INTO semesters (name, year) VALUES (?, ?)',
    [trimmedName, numYear]
  );
  return result.insertId;
}

module.exports = { list, findOrCreateSemester };
