const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
const { signToken } = require('../utils/jwt');
const { isValidEmail, isValidStudentId, generateUsername } = require('../utils/validators');
const asyncHandler = require('../utils/asyncHandler');

const SALT_ROUNDS = 10;

// Fields that are safe to send back to the client. Never include password_hash.
function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    studentId: user.student_id,
    username: user.username,
    role: user.role,
    createdAt: user.created_at,
  };
}

const register = asyncHandler(async (req, res) => {
  const { name, email, studentId, password, confirmPassword } = req.body;

  const errors = {};
  if (!name || !name.trim()) errors.name = 'Name is required.';
  if (!isValidEmail(email)) errors.email = 'Enter a valid email address.';
  if (!isValidStudentId(studentId)) {
    errors.studentId = 'Student ID must look like 2024-3-60-082.';
  }
  if (!password || password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }
  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  if (Object.keys(errors).length) {
    return res.status(400).json({ success: false, message: 'Please fix the errors below.', errors });
  }

  const [existing] = await pool.query(
    'SELECT id FROM users WHERE email = ? OR student_id = ? LIMIT 1',
    [email.trim().toLowerCase(), studentId.trim()]
  );

  if (existing.length) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email or student ID already exists.',
    });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Guarantee a unique public username (rare collision retry loop).
  let username = generateUsername(studentId);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const [taken] = await pool.query('SELECT id FROM users WHERE username = ? LIMIT 1', [username]);
    if (!taken.length) break;
    username = generateUsername(studentId);
  }

  const [result] = await pool.query(
    `INSERT INTO users (name, email, student_id, username, password_hash, role)
     VALUES (?, ?, ?, ?, ?, 'student')`,
    [name.trim(), email.trim().toLowerCase(), studentId.trim(), username, passwordHash]
  );

  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
  const user = rows[0];
  const token = signToken({ id: user.id, role: user.role, username: user.username });

  res.status(201).json({ success: true, message: 'Account created.', token, user: toPublicUser(user) });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!isValidEmail(email) || !password) {
    return res.status(400).json({ success: false, message: 'Invalid email or password.' });
  }

  const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email.trim().toLowerCase()]);
  const user = rows[0];

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const matches = await bcrypt.compare(password, user.password_hash);
  if (!matches) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const token = signToken({ id: user.id, role: user.role, username: user.username });
  res.json({ success: true, message: 'Logged in.', token, user: toPublicUser(user) });
});

const me = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!rows.length) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
  res.json({ success: true, user: toPublicUser(rows[0]) });
});

module.exports = { register, login, me, toPublicUser };
