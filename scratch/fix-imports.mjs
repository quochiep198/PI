import fs from 'node:fs';
import path from 'node:path';

function fixImportsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fixedContent = content.replace(/'\.\/db\.mjs'/g, "'../db.mjs'");
  if (content !== fixedContent) {
    fs.writeFileSync(filePath, fixedContent);
    console.log(`Fixed imports in ${filePath}`);
  }
}

// Fix core.mjs
fixImportsInFile('server/utils/core.mjs');

// Fix controllers
const controllersDir = 'server/controllers';
const files = fs.readdirSync(controllersDir);
for (const file of files) {
  if (file.endsWith('.mjs')) {
    fixImportsInFile(path.join(controllersDir, file));
  }
}
