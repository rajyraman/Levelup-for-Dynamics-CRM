import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, existsSync, mkdirSync } from 'fs';

// Custom plugin to convert levelup-extension.js from ES module to IIFE (production only)
function convertLevelUpExtensionPlugin() {
  return {
    name: 'convert-levelup-extension',
    generateBundle(_options: any, bundle: any) {
      // Skip conversion in development mode to preserve ESM for dev server
      if (process.env.NODE_ENV === 'development') {
        return;
      }

      // Find the levelup-extension.js file
      const levelupExtensionFile = bundle['levelup-extension.js'];
      if (levelupExtensionFile && levelupExtensionFile.type === 'chunk') {
        // Convert ES module format to IIFE
        let code = levelupExtensionFile.code;

        // Remove all export statements (handle multiline exports and different formats)
        code = code.replace(/export\s*\{[^}]*\}\s*;?\s*$/gm, '');
        code = code.replace(/export\s*\{[\s\S]*?\}\s*;?\s*$/gm, '');
        code = code.replace(/export\s+.*?;?\s*$/gm, '');

        // Remove any remaining export-related code at the end
        code = code.replace(/;\s*$/, ''); // Remove trailing semicolons
        code = code.trim();

        // Wrap the entire code in an IIFE
        code = `(function() {\n'use strict';\n${code}\n})();`;

        levelupExtensionFile.code = code;
      }
    },
  };
}

// Custom plugin to copy static files and generate preview
function copyStaticFilesPlugin() {
  return {
    name: 'copy-static-files',
    writeBundle() {
      const buildDir = resolve(__dirname, 'build');

      // Ensure build directory exists
      if (!existsSync(buildDir)) {
        mkdirSync(buildDir, { recursive: true });
      }

      // Copy static files
      const filesToCopy = [
        { from: 'src/manifest.json', to: 'build/manifest.json' },
        { from: 'src/sidebar/sidebar.html', to: 'build/sidebar.html' },
        { from: 'src/sidebar/sidebar.css', to: 'build/sidebar.css' },
        { from: 'src/popup.html', to: 'build/popup.html' },
      ];

      filesToCopy.forEach(({ from, to }) => {
        const fromPath = resolve(__dirname, from);
        const toPath = resolve(__dirname, to);

        // Create directory if it doesn't exist
        const toDir = resolve(toPath, '..');
        if (!existsSync(toDir)) {
          mkdirSync(toDir, { recursive: true });
        }

        if (existsSync(fromPath)) {
          copyFileSync(fromPath, toPath);
          console.log(`Copied: ${from} -> ${to}`);
        } else {
          console.warn(`Warning: Source file not found: ${from}`);
        }
      }); // Copy icons directory
      const iconsSourceDir = resolve(__dirname, 'src/icons');
      const iconsTargetDir = resolve(__dirname, 'build/icons');

      if (existsSync(iconsSourceDir)) {
        if (!existsSync(iconsTargetDir)) {
          mkdirSync(iconsTargetDir, { recursive: true });
        }

        const iconFiles = ['icon16.png', 'icon32.png', 'icon48.png', 'icon128.png'];
        iconFiles.forEach(file => {
          const sourcePath = resolve(iconsSourceDir, file);
          const targetPath = resolve(iconsTargetDir, file);

          if (existsSync(sourcePath)) {
            copyFileSync(sourcePath, targetPath);
            console.log(`Copied icon: ${file}`);
          }
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), convertLevelUpExtensionPlugin(), copyStaticFilesPlugin()],

  build: {
    outDir: 'build',
    emptyOutDir: true,

    // Increase chunk size warning limit for browser extensions
    chunkSizeWarningLimit: 1000,

    // Force inline bundling for Chrome extension compatibility
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background/background.ts'),
        sidebar: resolve(__dirname, 'src/sidebar/sidebar.tsx'),
        content: resolve(__dirname, 'src/content/content.ts'),
        'levelup-extension': resolve(__dirname, 'src/content/levelup.extension.ts'),
        popup: resolve(__dirname, 'src/popup/popup.tsx'),
      },

      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        // Use ES modules format for Manifest v3 compatibility
        format: 'es',
      },

      // Only externalize chrome API, everything else should be bundled
      external: id => {
        return id === 'chrome';
      },

      // Configure module interop for better Chrome extension compatibility
      makeAbsoluteExternalsRelative: false,
    },

    // Minification settings - more lenient in development
    minify: process.env.NODE_ENV === 'development' ? false : 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production',
        pure_funcs:
          process.env.NODE_ENV === 'production'
            ? ['console.log', 'console.info', 'console.debug', 'console.warn']
            : [],
        unused: true,
        dead_code: true,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: process.env.NODE_ENV === 'development',
      },
    },
    // Generate source maps for better debugging
    sourcemap: process.env.NODE_ENV === 'development' ? 'inline' : true,

    // Set target for browser extension compatibility
    target: 'chrome100',

    // Ensure assets are handled correctly
    assetsDir: '',
  },

  // Define environment variables
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },

  // Configure CSS processing
  css: {
    modules: false,
  },

  // Configure resolve settings
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '#types': resolve(__dirname, 'src/types'),
      '#services': resolve(__dirname, 'src/services'),
      '#components': resolve(__dirname, 'src/sidebar/components'),
      '#contexts': resolve(__dirname, 'src/sidebar/contexts'),
      '#hooks': resolve(__dirname, 'src/sidebar/hooks'),
      '#config': resolve(__dirname, 'src/sidebar/config'),
      '#utils': resolve(__dirname, 'src/utils'),
      '#content': resolve(__dirname, 'src/content'),
      '#background': resolve(__dirname, 'src/background'),
      '#data': resolve(__dirname, 'src/data'),
    },
  },

  // Ensure compatibility with Chrome extensions
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['chrome'],
  },

  // Enable better tree-shaking but preserve debugging in development
  esbuild: {
    treeShaking: true,
    minifyIdentifiers: process.env.NODE_ENV === 'production',
    minifySyntax: process.env.NODE_ENV === 'production',
    minifyWhitespace: process.env.NODE_ENV === 'production',
    keepNames: process.env.NODE_ENV === 'development',
  },

  // Additional optimization for Material-UI
  ssr: {
    noExternal: ['@mui/material', '@mui/icons-material'],
  },
});
