import dotenv from 'dotenv';
import { runMigrations } from './db.mjs';

dotenv.config();

await runMigrations();

console.log('Database migrations completed.');
