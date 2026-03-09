import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Selamat Datang Kembali")).toBeVisible({ timeout: 30000 });
    // Wait for React hydration
    await page.waitForFunction(() => document.activeElement?.id === "email", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);
  });

  test("should display login form correctly", async ({ page }) => {
    await expect(page.getByText("Selamat Datang Kembali")).toBeVisible();
    await expect(page.getByLabel("Alamat Email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Masuk" })).toBeVisible();
    await expect(page.getByText("Lanjutkan dengan Google")).toBeVisible();
    await expect(page.getByRole("link", { name: "Daftar di sini" })).toBeVisible();
  });

  test("should show validation errors for empty fields", async ({ page }) => {
    // Ensure fields are empty
    await page.getByLabel("Alamat Email").fill("");
    await page.locator("#password").fill("");

    await page.getByRole("button", { name: "Masuk" }).click();

    await expect(page.getByText("Email wajib diisi")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Password is required|Kata sandi/i)).toBeVisible({ timeout: 10000 });
  });

  test("should show error for invalid email format", async ({ page }) => {
    const emailInput = page.getByLabel("Alamat Email");
    await emailInput.fill("invalid-email");
    await page.locator("#password").fill("password123");
    await page.getByRole("button", { name: "Masuk" }).click();

    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(validationMessage).toBeTruthy();
  });

  test("should show error for wrong credentials", async ({ page }) => {
    await page.getByLabel("Alamat Email").fill("wrong@example.com");
    await page.locator("#password").fill("wrongpassword");
    await page.getByRole("button", { name: "Masuk" }).click();

    // Wait for error message
    await expect(page.getByText(/salah|gagal|invalid|error|Login gagal/i)).toBeVisible({ timeout: 60000 });
  });

  test("should toggle password visibility", async ({ page }) => {
    const passwordInput = page.locator("#password");
    await passwordInput.fill("mypassword");

    await expect(passwordInput).toHaveAttribute("type", "password");

    // Click eye icon to show password
    await page.locator('button[aria-label*="Show password"], button[aria-label*="password"]').first().click({ force: true });
    await expect(passwordInput).toHaveAttribute("type", "text", { timeout: 10000 });

    // Click again to hide
    await page.locator('button[aria-label*="Hide password"], button[aria-label*="password"]').first().click({ force: true });
    await expect(passwordInput).toHaveAttribute("type", "password", { timeout: 10000 });
  });

  test("should have working register link", async ({ page }) => {
    await page.getByRole("link", { name: "Daftar di sini" }).click();
    await expect(async () => {
      expect(page.url()).toContain("/register");
    }).toPass({ timeout: 30000 });
  });

  test("should have working forgot password link", async ({ page }) => {
    await page.getByRole("link", { name: "Lupa kata sandi?" }).click();
    await expect(async () => {
      expect(page.url()).toContain("/forgot-password");
    }).toPass({ timeout: 30000 });
  });
});
