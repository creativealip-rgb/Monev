import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  timeout: 120000,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "login",
      testMatch: /login\.spec\.ts/,
      testIgnore: /auth\.setup\.ts/,
    },
    {
      name: "chat",
      testMatch: /chat\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/.auth/user.json",
      },
      dependencies: ["setup"],
      testIgnore: [/auth\.setup\.ts/, /login\.spec\.ts/, /chat\.spec\.ts/],
    },
  ],
});
