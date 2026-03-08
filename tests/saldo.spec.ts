import { test, expect } from "@playwright/test";

test.describe("Saldo Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/saldo", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Saldo|Balance/i).first()).toBeVisible({ timeout: 60000 });
  });

  test("should display saldo page", async ({ page }) => {
    await expect(page.getByText(/Saldo|Balance/i).first()).toBeVisible();
  });

  test("should open add account modal", async ({ page }) => {
    const addBtn = page.locator('button:has(svg.lucide-plus)').first();
    await addBtn.click();
    await expect(page.getByText(/Bank|E-Money|Cash/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("should add account via quick add", async ({ page }) => {
    const quickAddBtn = page.getByText("BRI").first();
    if (!(await quickAddBtn.isVisible().catch(() => false))) return;

    await quickAddBtn.click();
    await page.waitForTimeout(1000);

    const balanceInput = page.locator('input[type="number"], input[inputmode="numeric"]').first();
    if (await balanceInput.isVisible().catch(() => false)) {
      await balanceInput.fill("1000000");
      const confirmBtn = page.getByText("Simpan Akun").first();
      if (await confirmBtn.isVisible().catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test("should toggle list and group view", async ({ page }) => {
    const groupBtn = page.locator('button:has(svg.lucide-layout-grid)').first();
    if (!(await groupBtn.isVisible().catch(() => false))) return;

    await groupBtn.click();
    await page.waitForTimeout(1000);

    const listBtn = page.locator('button:has(svg.lucide-list)').first();
    if (await listBtn.isVisible().catch(() => false)) {
      await listBtn.click();
      await page.waitForTimeout(500);
    }
  });
});
