import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function packageExtension(browserName = 'chromium') {
  const buildDir = path.join(__dirname, '..', 'build');

  // Read package.json
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version;

  // Create merged manifest for the specific browser
  await createMergedManifest(buildDir, browserName);

  // Validate build directory contains only compiled assets
  validateBuildDirectory(buildDir);

  // Create release directories
  const releaseDir = path.join(__dirname, '..', 'release');
  const versionDir = path.join(releaseDir, browserName, version);
  const packagePath = path.join(versionDir, `level-up-vnext-${browserName}-v${version}.zip`);

  if (!fs.existsSync(releaseDir)) {
    fs.mkdirSync(releaseDir, { recursive: true });
  }
  if (!fs.existsSync(versionDir)) {
    fs.mkdirSync(versionDir, { recursive: true });
  }

  // Create a file to stream archive data to
  const output = fs.createWriteStream(packagePath);
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Sets the compression level
  });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log('✅ Extension packaged successfully!');
      console.log(`📦 Package size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
      console.log(`📍 Location: ${packagePath}`);
      console.log(`🏷️ Version: ${version}`);
      console.log(`🌐 Browser: ${browserName}`);
      if (browserName === 'chromium') {
        console.log('\n🚀 To install:');
        console.log('1. Open Microsoft Edge or Chrome');
        console.log('2. Go to chrome://extensions/ or edge://extensions/');
        console.log('3. Enable "Developer mode"');
        console.log('4. Click "Load unpacked" and select the build folder');
        console.log('   OR extract this package and load the extracted folder');
      } else if (browserName === 'firefox') {
        console.log('\n🚀 To install:');
        console.log('1. Open Firefox');
        console.log('2. Go to about:debugging');
        console.log('3. Click "This Firefox"');
        console.log('4. Click "Load Temporary Add-on"');
        console.log('   OR extract this package and load the extracted folder');
      }
      resolve();
    });

    archive.on('error', err => {
      console.error('❌ Error creating package:', err);
      reject(err);
    });

    // Pipe archive data to the file
    archive.pipe(output);

    // Add files from build directory, excluding sourcemap files
    const ignorePatterns = ['**/*.map'];
    archive.glob('**/*', {
      cwd: buildDir,
      ignore: ignorePatterns,
    });

    // Finalize the archive
    archive.finalize();
  });
}

function validateBuildDirectory(buildDir) {
  const files = getAllFiles(buildDir);
  const invalidFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    // Exclude .map files from validation since we generate them for development but don't package them
    const invalidExtensions = ['.ts', '.scss', '.sass', '.less', '.d.ts'];
    return invalidExtensions.includes(ext);
  });

  if (invalidFiles.length > 0) {
    console.warn('⚠️ Warning: Found source files in build directory:');
    invalidFiles.forEach(file => {
      console.warn(`   - ${path.relative(buildDir, file)}`);
    });
  }

  // Check for required files
  const requiredFiles = [
    'manifest.json',
    'background.js',
    'content.js',
    'levelup-extension.js',
    'popup.html',
    'popup.js',
    'sidebar.js',
    'sidebar.html',
    'sidebar.css',
  ];

  const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(buildDir, file)));

  if (missingFiles.length > 0) {
    console.error('❌ Missing required files in build directory:');
    missingFiles.forEach(file => {
      console.error(`   - ${file}`);
    });
    process.exit(1);
  }

  console.log('✅ Build directory validation passed');
}

function getAllFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function createMergedManifest(buildDir, browserName) {
  const srcDir = path.join(__dirname, '..', 'src');

  // Read the three manifest files
  const commonManifest = JSON.parse(
    fs.readFileSync(path.join(srcDir, 'manifest_common.json'), 'utf8')
  );
  const browserManifest = JSON.parse(
    fs.readFileSync(path.join(srcDir, `manifest_${browserName}.json`), 'utf8')
  );

  // Merge the manifests (browser-specific properties override common ones)
  const mergedManifest = {
    ...commonManifest,
    ...browserManifest,
  };

  // Write the merged manifest to build directory
  const manifestPath = path.join(buildDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(mergedManifest, null, 2));

  console.log(`✅ Created merged manifest for ${browserName}`);
}

// Create proper icon files (SVG converted to simple format for development)
function createIconAssets() {
  const iconsDir = path.join(__dirname, '..', 'build', 'icons');

  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Copy and validate icon files exist
  const iconSizes = [16, 32, 48, 128];

  iconSizes.forEach(size => {
    const iconPath = path.join(iconsDir, `icon${size}.png`);
    if (!fs.existsSync(iconPath)) {
      console.warn(`⚠️ Warning: Icon file missing: icon${size}.png`);
    }
  });

  console.log('📁 Icon assets validated');
}

// Run the packaging
const browserName = process.argv[2] || 'chromium';
console.log(`📦 Packaging Level Up extension for ${browserName}...`);
console.log('🔍 Validating build assets...');
createIconAssets();
packageExtension(browserName).catch(console.error);
