import { defineConfig, devices } from "@playwright/test";

const allEngines = Boolean(process.env.CI) || process.env.RTL_BROWSER_ENGINES === "all";

export default defineConfig({
  testDir: "test/browser",
  testMatch: /.*\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.05 } },
  snapshotPathTemplate: "{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}{-projectName}{ext}",
  globalSetup: "./test/browser/global-setup.ts",
  projects: allEngines
    ? [
      { name: "chromium", use: { ...devices["Desktop Chrome"] } },
      { name: "firefox", use: { ...devices["Desktop Firefox"] } },
      { name: "webkit", use: { ...devices["Desktop Safari"] } },
    ]
    : [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
