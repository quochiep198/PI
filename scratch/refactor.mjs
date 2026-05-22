import fs from 'node:fs';
import path from 'node:path';

const handlersPath = path.resolve('server/handlers.mjs');
const sourceCode = fs.readFileSync(handlersPath, 'utf-8');

const lines = sourceCode.split('\n');

let coreLines = [];
let exportedFunctions = {}; // name -> code string

let currentFuncName = null;
let currentFuncLines = [];
let braceCount = 0;
let inExportFunc = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Count braces to know when we're at top-level
  const openBraces = (line.match(/\{/g) || []).length;
  const closeBraces = (line.match(/\}/g) || []).length;

  if (braceCount === 0 && line.startsWith('export async function ') || line.startsWith('export function ')) {
    inExportFunc = true;
    currentFuncName = line.match(/export (?:async )?function (\w+)/)[1];
    currentFuncLines = [line];
    braceCount += openBraces - closeBraces;
    
    if (braceCount === 0) {
      // one-liner function?
      exportedFunctions[currentFuncName] = currentFuncLines.join('\n');
      inExportFunc = false;
      currentFuncName = null;
    }
    continue;
  }

  if (inExportFunc) {
    currentFuncLines.push(line);
    braceCount += openBraces - closeBraces;
    if (braceCount <= 0) {
      exportedFunctions[currentFuncName] = currentFuncLines.join('\n');
      inExportFunc = false;
      currentFuncName = null;
      braceCount = 0; // reset just in case
    }
  } else {
    coreLines.push(line);
    braceCount += openBraces - closeBraces;
    if (braceCount < 0) braceCount = 0;
  }
}

// Now coreLines contains all imports, constants, and internal functions.
let coreCode = coreLines.join('\n');

// 1. Extract all import statements
const importRegex = /^import .+?;/gm;
const imports = [];
let match;
while ((match = importRegex.exec(coreCode)) !== null) {
  imports.push(match[0]);
}

// We will keep imports in coreCode, but we also want them for controllers.

// 2. Identify top-level declarations to export from core.mjs
const exportNames = new Set();

coreCode = coreCode.replace(/^(async function|function) (\w+)/gm, (match, type, name) => {
  exportNames.add(name);
  return `export ${match}`;
});

coreCode = coreCode.replace(/^const ([A-Za-z0-9_]+)\s*=/gm, (match, name) => {
  exportNames.add(name);
  return `export ${match}`;
});

coreCode = coreCode.replace(/^let ([A-Za-z0-9_]+)\s*=/gm, (match, name) => {
  exportNames.add(name);
  return `export ${match}`;
});

coreCode = coreCode.replace(/^class (\w+)/gm, (match, name) => {
  exportNames.add(name);
  return `export ${match}`;
});

// Create directories
if (!fs.existsSync('server/utils')) fs.mkdirSync('server/utils', { recursive: true });
if (!fs.existsSync('server/controllers')) fs.mkdirSync('server/controllers', { recursive: true });

// Write core.mjs
fs.writeFileSync('server/utils/core.mjs', coreCode);
console.log('Wrote server/utils/core.mjs');

// 3. Define groups
const groups = {
  auth: ['authMeHandler', 'loginHandler', 'registerHandler', 'forgotPasswordHandler', 'verifyOtpHandler', 'logoutHandler'],
  lessons: ['lessonsHandler', 'createLessonHandler'],
  progress: ['progressHandler', 'completeProgressHandler'],
  users: ['updateAvatarHandler', 'updateSettingsHandler'],
  gamification: ['getXpHandler', 'postXpHandler', 'addXpHandler', 'getCoinsHandler', 'getLeaderboardHandler', 'getStreakHandler', 'checkInHandler', 'recordFirstSuccessHandler'],
  challenges: ['getChallengesHandler', 'submitChallengeHandler'],
  admin: ['getAvatarsHandler', 'createAvatarHandler', 'getItemsHandler', 'createItemHandler'],
  system: ['healthHandler', 'onlinePresenceStreamHandler'],
  ai: ['errorFeedbackHandler', 'hintHandler']
};

const allNamesArray = Array.from(exportNames).join(',\n  ');
const importCoreStatement = `import {\n  ${allNamesArray}\n} from '../utils/core.mjs';\n\n`;
const importStatements = imports.join('\n') + '\n\n' + importCoreStatement;

for (const [groupName, funcNames] of Object.entries(groups)) {
  let groupCode = importStatements;
  
  for (const funcName of funcNames) {
    if (exportedFunctions[funcName]) {
      // Remove 'export ' from the handler to write clean, or keep it.
      // We MUST keep 'export ' so index.mjs can import them!
      groupCode += exportedFunctions[funcName] + '\n\n';
    } else {
      console.warn(`Function ${funcName} not found!`);
    }
  }

  fs.writeFileSync(`server/controllers/${groupName}.mjs`, groupCode);
  console.log(`Wrote server/controllers/${groupName}.mjs`);
}

// Generate new server/index.mjs
let newIndexCode = `import cors from 'cors';\nimport dotenv from 'dotenv';\nimport express from 'express';\n`;
newIndexCode += `import { runMigrations } from './db.mjs';\n`;

for (const [groupName, funcNames] of Object.entries(groups)) {
  const presentFuncs = funcNames.filter(name => exportedFunctions[name]);
  if (presentFuncs.length > 0) {
    newIndexCode += `import { ${presentFuncs.join(', ')} } from './controllers/${groupName}.mjs';\n`;
  }
}

newIndexCode += `\ndotenv.config();\n
const app = express();
const port = Number(process.env.API_PORT || 3001);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', healthHandler);
app.get('/api/auth/me', authMeHandler);
app.get('/api/presence/stream', onlinePresenceStreamHandler);
app.post('/api/auth/login', loginHandler);
app.post('/api/auth/register', registerHandler);
app.post('/api/auth/forgot-password', forgotPasswordHandler);
app.post('/api/auth/forgot-password/verify-otp', verifyOtpHandler);
app.post('/api/auth/logout', logoutHandler);
app.post('/api/users/me/avatar', updateAvatarHandler);
app.post('/api/users/me/settings', updateSettingsHandler);
app.get('/api/lessons', lessonsHandler);
app.get('/api/progress', progressHandler);
app.post('/api/progress/complete', completeProgressHandler);
app.get('/api/xp', getXpHandler);
app.post('/api/xp', postXpHandler);
app.get('/api/coins', getCoinsHandler);
app.get('/api/leaderboard', getLeaderboardHandler);
app.get('/api/streak/:userId', getStreakHandler);
app.post('/api/streak/:userId/checkin', checkInHandler);
app.get('/api/challenges', getChallengesHandler);
app.post('/api/challenges/submit', submitChallengeHandler);

// Avatar routes (admin only)
app.get('/api/avatars', getAvatarsHandler);
app.post('/api/avatars', createAvatarHandler);

// Item routes (admin only)
app.get('/api/items', getItemsHandler);
app.post('/api/items', createItemHandler);
app.post('/api/error-feedback', errorFeedbackHandler);
app.post('/api/hint', hintHandler);
app.post('/api/lessons', createLessonHandler);

await runMigrations();

app.listen(port, () => {
  console.log(\`Lessons API listening on http://localhost:\${port}\`);
});
`;

fs.writeFileSync('server/index.mjs', newIndexCode);
console.log('Wrote new server/index.mjs');

// Generate new api/index.js
let newApiIndexCode = `import express from 'express';\nimport cors from 'cors';\nimport { runMigrations } from '../server/db.mjs';\n`;

for (const [groupName, funcNames] of Object.entries(groups)) {
  const presentFuncs = funcNames.filter(name => exportedFunctions[name]);
  if (presentFuncs.length > 0) {
    newApiIndexCode += `import { ${presentFuncs.join(', ')} } from '../server/controllers/${groupName}.mjs';\n`;
  }
}

newApiIndexCode += `\nconst app = express();\n
await runMigrations();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', healthHandler);

app.get('/api/auth/me', authMeHandler);
app.get('/api/presence/stream', onlinePresenceStreamHandler);
app.post('/api/auth/login', loginHandler);
app.post('/api/auth/register', registerHandler);
app.post('/api/auth/forgot-password', forgotPasswordHandler);
app.post('/api/auth/forgot-password/verify-otp', verifyOtpHandler);
app.post('/api/auth/logout', logoutHandler);
app.post('/api/users/me/avatar', updateAvatarHandler);
app.post('/api/users/me/settings', updateSettingsHandler);

app.get('/api/lessons', lessonsHandler);
app.post('/api/lessons', createLessonHandler);

app.get('/api/progress', progressHandler);
app.post('/api/progress/complete', completeProgressHandler);

app.get('/api/xp', getXpHandler);
app.post('/api/xp', postXpHandler);
app.get('/api/coins', getCoinsHandler);
app.get('/api/leaderboard', getLeaderboardHandler);
app.get('/api/streak/:userId', getStreakHandler);
app.post('/api/streak/:userId/checkin', checkInHandler);

app.post('/api/error-feedback', errorFeedbackHandler);
app.post('/api/hint', hintHandler);

// Challenge routes
app.get('/api/challenges', getChallengesHandler);
app.post('/api/challenges/submit', submitChallengeHandler);

// Avatar routes (admin only)
app.get('/api/avatars', getAvatarsHandler);
app.post('/api/avatars', createAvatarHandler);

// Item routes (admin only)
app.get('/api/items', getItemsHandler);
app.post('/api/items', createItemHandler);

export default app;
`;

fs.writeFileSync('api/index.js', newApiIndexCode);
console.log('Wrote new api/index.js');
