// lib/db.js
// Postgres connection pool. Works with Supabase, Neon, Railway, or any
// standard Postgres connection string in DATABASE_URL.

import { Pool } from 'pg';

let pool;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('localhost')
        ? false
        : { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function query(text, params) {
  const pool = getPool();
  return pool.query(text, params);
}
