import { execute } from '../server/db.mjs';

async function main() {
  console.log('Updating wand emoji...');
  try {
    const res = await execute(
      "UPDATE items SET image_data = '✨' WHERE name = 'Cây Đũa Thần Python'"
    );
    console.log('Successfully updated Cây Đũa Thần Python image_data to ✨', res);
    process.exit(0);
  } catch (error) {
    console.error('Failed to update emoji:', error);
    process.exit(1);
  }
}

main();
