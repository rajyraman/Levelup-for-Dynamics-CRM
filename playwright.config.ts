import { defineConfig } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: require.resolve('./tests/global-setup'),
  use: {
    storageState: path.resolve(__dirname, './tests/.auth/user.json'),
    headless: false,
    baseURL: process.env.BASE_URL,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  reporter: [['html', { outputFolder: 'docs/test-reports' }]],
  projects: [
    {
      name: 'edge-extension',
      use: {
        browserName: 'chromium',
        channel: 'msedge',
      },
    },
  ],
});
