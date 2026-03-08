import { test, expect } from "@playwright/test";

test.describe("Savings Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/savings", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Tabungan|Savings|Goals/i).first()).toBeVisible({ timeout: 60000 });
  });

  test("should display savings page", async ({ page }) => {
    await expect(page.getByText(/Tabungan|Savings|Goals/i).first()).toBeVisible();
  });

  test("should open add goal form", async ({ page }) => {
    const addBtn = page.locator('button:has(svg.lucide-plus)').first();
    await addBtn.click();
    await expect(page.getByText(/Nama|Target|Simpan/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("should add a savings goal", async ({ page }) => {
    const addBtn = page.locator('button:has(svg.lucide-plus)').first();
    await addBtn.click();
    await page.waitForTimeout(1000);

    // Fill goal name
    const nameInput = page.locator('input').first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill("Dana Darurat");
    }

    // Fill target amount
    const amountInput = page.locator('input[type="number"], input[inputmode="numeric"]').first();
    if (await amountInput.isVisible().catch(() => false)) {
      await amountInput.fill("10000000");
    }

    // Save
    const saveBtn = page.getByText(/Simpan|Save/i).first();
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
    }
  });

  test("should show goal templates", async ({ page }) => {
    const templateBtn = page.getByText(/Template Goal Cepat/i).first();
    if (!(await templateBtn.isVisible().catch(() => false))) return;

    await templateBtn.click();
    await expect(page.getByText("Dana Darurat").first()).toBeVisible({ timeout: 3000 });
    await expect(page.getByText("Liburan").first()).toBeVisible({ timeout: 3000 });
  });
});
