const { pool } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, code FROM departments ORDER BY name ASC');
  res.json({ success: true, departments: rows });
});

module.exports = { list };
