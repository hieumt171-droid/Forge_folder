import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendEntry = path.join(__dirname, '../src/frontend/index.jsx');

if (!fs.existsSync(frontendEntry)) {
  console.error(`Missing frontend entry: ${frontendEntry}`);
  process.exit(1);
}

const source = fs.readFileSync(frontendEntry, 'utf8');
if (!source.includes('ForgeReconciler.render')) {
  console.error('Frontend entry must render with ForgeReconciler.');
  process.exit(1);
}

console.log('Frontend build check passed:', frontendEntry);
