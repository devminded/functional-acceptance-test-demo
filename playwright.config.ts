import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

// Not 3000, so the acceptance tests never pick up a development server that is already running.
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

const testDir = defineBddConfig({
  features: 'test/acceptance/features/*.feature',
  steps: ['test/acceptance/steps/*.ts', 'test/acceptance/fixtures.ts'],
});

export default defineConfig({
  testDir,
  fullyParallel: true,
  forbidOnly: isGitHubActions,
  reporter: isGitHubActions ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Serves the built pages from dist/, so run `npm run build` first (`make acceptance` does).
    command: 'npm start',
    url: `${BASE_URL}/sign-in.html`,
    reuseExistingServer: false,
    env: { PORT: String(PORT), EXPOSE_TEST_MAILBOX: 'true' },
  },
});
