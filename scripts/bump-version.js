#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function usage() {
  console.error('Usage: node scripts/bump-version.js [major|minor|patch|<version>]');
  process.exit(1);
}

const arg = process.argv[2];
if (!arg) {
  usage();
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, obj) {
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function bumpSemver(version, part) {
  const m = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.*))?$/);
  if (!m) {
    return null;
  }
  let major = parseInt(m[1], 10);
  let minor = parseInt(m[2], 10);
  let patch = parseInt(m[3], 10);
  if (part === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (part === 'minor') {
    minor += 1;
    patch = 0;
  } else if (part === 'patch') {
    patch += 1;
  } else {
    return null;
  }
  return `${major}.${minor}.${patch}`;
}

const repoRoot = path.resolve(__dirname, '..');
const packageJsonPath = path.join(repoRoot, 'package.json');
const manifestPath = path.join(repoRoot, 'src', 'manifest.json');

const pkg = readJson(packageJsonPath);
const manifest = readJson(manifestPath);

let newVersion = null;
if (['major', 'minor', 'patch'].includes(arg)) {
  newVersion = bumpSemver(pkg.version, arg);
  if (!newVersion) {
    console.error('Current package.json version not semver:', pkg.version);
    process.exit(1);
  }
} else if (/^\d+\.\d+\.\d+(?:-.+)?$/.test(arg)) {
  newVersion = arg;
} else {
  usage();
}

pkg.version = newVersion;
if (manifest && typeof manifest === 'object') {
  manifest.version = newVersion;
}

writeJson(packageJsonPath, pkg);
writeJson(manifestPath, manifest);

console.log('Bumped version to', newVersion);
