const { pool } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const { q } = req.query;
  let sql = 'SELECT id, name, department_id FROM faculties';
  const params = [];
  if (q) {
    sql += ' WHERE name LIKE ?';
    params.push(`%${q}%`);
  }
  sql += ' ORDER BY name ASC LIMIT 50';
  const [rows] = await pool.query(sql, params);
  res.json({ success: true, faculties: rows });
});

// Used internally by the questions controller: looks up a faculty by exact
// name (case-insensitive) or creates a new record. Keeps the questions
// table free of repeated faculty name strings (normalization).
async function findOrCreateFaculty(name, departmentId, connection = pool) {
  if (!name || !name.trim()) return null;
  const trimmed = name.trim();

  const [existing] = await connection.query(
    'SELECT id FROM faculties WHERE LOWER(name) = LOWER(?) LIMIT 1',
    [trimmed]
  );
  if (existing.length) return existing[0].id;

  const [result] = await connection.query(
    'INSERT INTO faculties (name, department_id) VALUES (?, ?)',
    [trimmed, departmentId || null]
  );
  return result.insertId;
}

module.exports = { list, findOrCreateFaculty };
