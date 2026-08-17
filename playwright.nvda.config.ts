import { defineConfig, devices } from "@playwright/test";
import { screenReaderConfig } from "@guidepup/playwright";

export default defineConfig({
  ...screenReaderConfig,
  testDir: "test/at",
  testMatch: /nvda\.spec\.ts/,
  timeout: 5 * 60 * 1000,
  retries: process.env.CI ? 2 : 0,
  globalSetup: "./test/browser/global-setup.ts",
  projects: [{ name: "firefox", use: { ...devices["Desktop Firefox"], headless: false } }],
});
