import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Welcome Back")).toBeVisible({ timeout: 30000 });
    // Wait for React hydration
    await page.waitForFunction(() => document.activeElement?.id === "email", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);
  });

  test("should display login form correctly", async ({ page }) => {
    await expect(page.getByText("Welcome Back")).toBeVisible();
    await expect(page.getByLabel("Email Address")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
    await expect(page.getByText("Lanjutkan dengan Google")).toBeVisible();
    await expect(page.getByText("Coba Tanpa Akun")).toBeVisible();
    await expect(page.getByRole("link", { name: "Register here" })).toBeVisible();
  });

  test("should show validation errors for empty fields", async ({ page }) => {
    // Ensure fields are empty
    await page.getByLabel("Email Address").fill("");
    await page.locator("#password").fill("");

    await page.getByRole("button", { name: "Login" }).click();

    await expect(page.getByText("Email is required")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Password is required")).toBeVisible({ timeout: 10000 });
  });

  test("should show error for invalid email format", async ({ page }) => {
    const emailInput = page.getByLabel("Email Address");
    await emailInput.fill("invalid-email");
    await page.locator("#password").fill("password123");
    await page.getByRole("button", { name: "Login" }).click();

    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(validationMessage).toBeTruthy();
  });

  test("should show error for wrong credentials", async ({ page }) => {
    await page.getByLabel("Email Address").fill("wrong@example.com");
    await page.locator("#password").fill("wrongpassword");
    await page.getByRole("button", { name: "Login" }).click();

    // Wait for error message
    await expect(page.getByText(/salah|gagal|invalid|error/i)).toBeVisible({ timeout: 60000 });
  });

  test("should toggle password visibility", async ({ page }) => {
    const passwordInput = page.locator("#password");
    await passwordInput.fill("mypassword");

    await expect(passwordInput).toHaveAttribute("type", "password");

    // Use force click to ensure React event fires
    await page.getByRole("button", { name: "Show password" }).click({ force: true });
    await expect(passwordInput).toHaveAttribute("type", "text", { timeout: 10000 });

    await page.getByRole("button", { name: "Hide password" }).click({ force: true });
    await expect(passwordInput).toHaveAttribute("type", "password", { timeout: 10000 });
  });

  test("should have working register link", async ({ page }) => {
    await page.getByRole("link", { name: "Register here" }).click();
    await expect(async () => {
      expect(page.url()).toContain("/register");
    }).toPass({ timeout: 30000 });
  });

  test("should have working forgot password link", async ({ page }) => {
    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(async () => {
      expect(page.url()).toContain("/forgot-password");
    }).toPass({ timeout: 30000 });
  });
});
