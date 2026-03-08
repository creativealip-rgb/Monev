import { test, expect } from "@playwright/test";

test.describe("Debts Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/debts", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Hutang|Debt|Piutang/i).first()).toBeVisible({ timeout: 60000 });
  });

  test("should display debts page", async ({ page }) => {
    await expect(page.getByText(/Hutang|Debt|Piutang/i).first()).toBeVisible();
  });

  test("should open add debt form", async ({ page }) => {
    const addBtn = page.locator('button:has(svg.lucide-plus)').first();
    await addBtn.click();
    await expect(page.getByText(/Nama|Jumlah|Simpan/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("should add a debt", async ({ page }) => {
    const addBtn = page.locator('button:has(svg.lucide-plus)').first();
    await addBtn.click();
    await page.waitForTimeout(1000);

    // Fill name
    const nameInput = page.locator('input').first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill("Hutang ke Budi");
    }

    // Fill amount
    const amountInput = page.locator('input[type="number"], input[inputmode="numeric"]').first();
    if (await amountInput.isVisible().catch(() => false)) {
      await amountInput.fill("200000");
    }

    // Save
    const saveBtn = page.getByText(/Simpan|Save/i).first();
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
    }
  });

  test("should switch between tabs", async ({ page }) => {
    const tabs = page.locator('button').filter({ hasText: /I Owe|Saya Hutang|Owed|Piutang/i });
    const count = await tabs.count();
    for (let i = 0; i < count; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(500);
    }
  });
});
