import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not configured.');
}

const pool = new Pool({
  connectionString,
});

export async function query(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}
