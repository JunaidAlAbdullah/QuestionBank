const { pool } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// Public, pseudonymous profile — never exposes name, email, or student ID.
const getPublicProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const [users] = await pool.query('SELECT id, username, created_at FROM users WHERE username = ? LIMIT 1', [username]);
  if (!users.length) {
    return res.status(404).json({ success: false, message: 'Profile not found.' });
  }
  const user = users[0];

  const [stats] = await pool.query(
    `SELECT COUNT(*) AS total_uploads, COALESCE(SUM(blessings_count), 0) AS total_blessings,
            COALESCE(SUM(downloads), 0) AS total_downloads
     FROM questions WHERE uploaded_by = ? AND is_removed = 0`,
    [user.id]
  );

  res.json({
    success: true,
    profile: {
      username: user.username,
      memberSince: user.created_at,
      totalUploads: stats[0].total_uploads,
      totalBlessings: Number(stats[0].total_blessings),
      totalDownloads: Number(stats[0].total_downloads),
    },
  });
});

module.exports = { getPublicProfile };
