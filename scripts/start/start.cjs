#!/usr/bin/env node
/**
 * Cross-platform dev server launcher (Windows, macOS, Linux).
 * Checks Node/npm versions, installs dependencies if needed, runs ng serve.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const NODE_MAJOR_MIN = 18;
const NPM_MAJOR_MIN = 9;
const PORT = 4200;
const STAMP_FILE = path.join('node_modules', '.install.stamp');

function log(msg, type = 'info') {
  const pref = type === 'ok' ? '✅' : type === 'warn' ? '⚠️' : type === 'err' ? '❌' : '⚙️';
  console.log(`${pref} ${msg}`);
}

function run(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf8', ...opts });
}

function needInstall() {
  if (!fs.existsSync('node_modules')) return true;
  if (!fs.existsSync(STAMP_FILE)) return true;
  try {
    const lockStat = fs.statSync('package-lock.json');
    const stampStat = fs.statSync(STAMP_FILE);
    return lockStat.mtimeMs > stampStat.mtimeMs;
  } catch {
    return true;
  }
}

function main() {
  console.log('');
  console.log('=====================================');
  console.log('  Web Worker Patterns - Angular App');
  console.log('=====================================');
  console.log('');

  let nodeVersion, npmVersion;
  try {
    nodeVersion = run('node -v').trim().replace(/^v/, '');
    npmVersion = run('npm -v').trim();
  } catch (e) {
    log('Node.js or npm not found. Install from https://nodejs.org/', 'err');
    process.exit(1);
  }

  const nodeMajor = parseInt(nodeVersion.split('.')[0], 10);
  const npmMajor = parseInt(npmVersion.split('.')[0], 10);

  if (nodeMajor < NODE_MAJOR_MIN) {
    log(`Node.js >= ${NODE_MAJOR_MIN}.x required (found ${nodeVersion}).`, 'err');
    process.exit(1);
  }
  if (npmMajor < NPM_MAJOR_MIN) {
    log(`npm >= ${NPM_MAJOR_MIN}.x required (found ${npmVersion}). Run: npm install -g npm`, 'err');
    process.exit(1);
  }

  log(`Node.js ${nodeVersion}`);
  log(`npm ${npmVersion}`);

  if (needInstall()) {
    log('Installing dependencies...', 'warn');
    try {
      run('npm install');
      fs.mkdirSync(path.dirname(STAMP_FILE), { recursive: true });
    } catch (e) {
      log('npm install failed.', 'err');
      process.exit(1);
    }
    try {
      fs.writeFileSync(STAMP_FILE, '');
    } catch (_) {}
    log('Dependencies ready.');
  } else {
    log('Dependencies up to date (skipping npm install).');
  }

  console.log('');
  log(`Starting Angular dev server at http://localhost:${PORT}`, 'warn');
  console.log('   Press Ctrl+C to stop.');
  console.log('');

  const child = spawn(
    'npm',
    ['run', 'start', '--', '--host', '0.0.0.0', '--port', String(PORT)],
    { stdio: 'inherit', shell: true }
  );

  child.on('exit', (code) => process.exit(code ?? 0));
}

main();
