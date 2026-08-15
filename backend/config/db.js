const mysql = require('mysql2/promise');
const config = require('./env');

// A shared connection pool. Every controller uses this instead of opening
// a new connection per request.
//
// Aiven (and most cloud MySQL hosts) require SSL. Setting DB_SSL=true turns
// this on. `rejectUnauthorized: false` trusts the host's certificate without
// needing you to download and configure Aiven's CA file separately — good
// enough for a student project connecting over a normal internet connection.
const poolConfig = {
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
};

if (config.db.ssl) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(poolConfig);

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
