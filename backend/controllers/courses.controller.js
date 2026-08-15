const { pool } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { normalizeCourseCode } = require('../utils/validators');

const list = asyncHandler(async (req, res) => {
  const { q } = req.query;
  let sql = `SELECT c.id, c.course_code, c.course_name, c.department_id, d.name AS department_name
             FROM courses c LEFT JOIN departments d ON d.id = c.department_id`;
  const params = [];
  if (q) {
    sql += ' WHERE c.course_code LIKE ? OR c.course_name LIKE ?';
    params.push(`%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY c.course_code ASC LIMIT 50';
  const [rows] = await pool.query(sql, params);
  res.json({ success: true, courses: rows });
});

// Finds a course by its normalized code, or creates it. This is how the
// upload form lets students type a course code/name freely while the
// database still stays normalized (one row per course).
async function findOrCreateCourse(courseCode, courseName, departmentId, connection = pool) {
  const code = normalizeCourseCode(courseCode);
  if (!code) return null;

  const [existing] = await connection.query('SELECT id FROM courses WHERE course_code = ? LIMIT 1', [code]);
  if (existing.length) return existing[0].id;

  const [result] = await connection.query(
    'INSERT INTO courses (course_code, course_name, department_id) VALUES (?, ?, ?)',
    [code, (courseName || code).trim(), departmentId || null]
  );
  return result.insertId;
}

module.exports = { list, findOrCreateCourse };
