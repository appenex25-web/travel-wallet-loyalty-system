const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const repoRoot = path.join(__dirname, '..', '..');
const webDir = path.join(repoRoot, 'web');
const webDist = path.join(webDir, 'dist');
const dest = path.join(__dirname, 'resources', 'web-dist');

console.log('Building web app...');
execSync('npm run build', { cwd: webDir, stdio: 'inherit' });

if (!fs.existsSync(webDist)) {
  console.error('web/dist not found after build');
  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true });
fs.cpSync(webDist, dest, { recursive: true });
console.log('Copied web dist to tray/resources/web-dist');
