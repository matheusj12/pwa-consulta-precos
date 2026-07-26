const { Pool } = require('pg');

let pool;

/**
 * Lazily creates a single pooled Postgres connection, reused across
 * invocations of the same serverless function instance. Accepts whichever
 * connection string env var is present so this works both with Vercel's
 * Postgres integration (POSTGRES_URL) and a plain DATABASE_URL locally.
 */
function getPool() {
  if (!pool) {
    const connectionString =
      process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('No Postgres connection string found (POSTGRES_URL / DATABASE_URL).');
    }
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function query(text, params) {
  return getPool().query(text, params);
}

module.exports = { query, getPool };
