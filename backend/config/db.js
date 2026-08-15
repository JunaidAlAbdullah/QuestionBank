const mysql = require('mysql2/promise');
const config = require('./env');

// A shared connection pool. Every controller uses this instead of opening
// a new connection per request.
const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    // eslint-disable-next-line no-console
    console.log('[db] Connected to MySQL database:', config.db.name);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[db] Failed to connect to MySQL:', err.message);
  }
}

module.exports = { pool, testConnection };
