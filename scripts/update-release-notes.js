#!/usr/bin/env node

/**
 * Release Notes Update Script
 *
 * This script helps maintain the release notes file with version information.
 * Usage: node scripts/update-release-notes.js <version> [release-date]
 *
 * Examples:
 *   node scripts/update-release-notes.js 4.2.0
 *   node scripts/update-release-notes.js 4.2.0 2025-02-15
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const newVersion = args[0];
const builtDate = args[1] || new Date().toISOString().split('T')[0]; // Use today if not specified

if (!newVersion) {
  console.error('❌ Version is required');
  console.log('Usage: node scripts/update-release-notes.js <version> [release-date]');
  console.log('Example: node scripts/update-release-notes.js 4.2.0 2025-02-15');
  process.exit(1);
}

// Validate version format (basic semver check)
if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?$/.test(newVersion)) {
  console.error('❌ Invalid version format. Use semantic versioning (e.g., 1.0.0, 2.1.3-beta)');
  process.exit(1);
}

const releaseNotesPath = path.join(__dirname, '..', 'src', 'data', 'release-notes.json');

try {
  // Read current release notes
  const currentReleaseNotes = JSON.parse(fs.readFileSync(releaseNotesPath, 'utf8'));

  // Update version and date
  currentReleaseNotes.version = newVersion;
  currentReleaseNotes.builtDate = builtDate;
  currentReleaseNotes.title = `What's New in v${newVersion}`;

  // Write updated release notes
  fs.writeFileSync(releaseNotesPath, JSON.stringify(currentReleaseNotes, null, 2));

  console.log('✅ Release notes updated successfully!');
  console.log(`📝 Version: ${newVersion}`);
  console.log(`📅 Release Date: ${builtDate}`);
  console.log(`📄 File: ${releaseNotesPath}`);
  console.log('');
  console.log('💡 Remember to:');
  console.log('   1. Update the sections array with new features/fixes');
  console.log('   2. Update package.json version if needed');
  console.log('   3. Test the information dialog to ensure changes appear correctly');
} catch (error) {
  console.error('❌ Error updating release notes:', error.message);
  process.exit(1);
}
