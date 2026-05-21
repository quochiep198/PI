import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not configured.');
}

const sql = neon(connectionString);
const migrationsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../database/migrations');
let migrationPromise = null;

export async function query(text, params = []) {
  const result = await sql.query(text, params);
  return Array.isArray(result) ? result : result?.rows ?? [];
}

export async function execute(text, params = []) {
  return sql.query(text, params);
}

function splitSqlStatements(sqlText) {
  return sqlText
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function ensureMigrationsTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrationFilenames() {
  const rows = await query(`
    SELECT filename
    FROM schema_migrations
    ORDER BY filename ASC
  `);

  return new Set(rows.map((row) => row.filename));
}

async function applyMigrationFile(filename) {
  const migrationPath = path.join(migrationsDir, filename);
  const sqlText = await readFile(migrationPath, 'utf8');
  const statements = splitSqlStatements(sqlText);

  for (const statement of statements) {
    await execute(statement);
  }

  await execute(
    `
      INSERT INTO schema_migrations (filename)
      VALUES ($1)
      ON CONFLICT (filename) DO NOTHING
    `,
    [filename],
  );
}

async function runMigrationsInternal() {
  await ensureMigrationsTable();

  const migrationEntries = await readdir(migrationsDir, { withFileTypes: true });
  const migrationFiles = migrationEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  const appliedMigrations = await getAppliedMigrationFilenames();

  for (const filename of migrationFiles) {
    if (appliedMigrations.has(filename)) {
      continue;
    }

    await applyMigrationFile(filename);
  }
}

export async function runMigrations() {
  if (!migrationPromise) {
    migrationPromise = runMigrationsInternal().catch((error) => {
      migrationPromise = null;
      throw error;
    });
  }

  return migrationPromise;
}
