import { query } from '../server/db.mjs';

async function main() {
  try {
    console.log('Updating items...');
    await query('UPDATE items SET image_data = $1 WHERE name = $2', ['🥤', 'Trà Sữa Trân Châu']);
    await query('UPDATE items SET image_data = $1 WHERE name = $2', ['🎐', 'Quạt Trầm Tĩnh']);
    console.log('Database updated successfully!');
  } catch (error) {
    console.error('Failed to update database:', error);
  }
  process.exit(0);
}

main();
