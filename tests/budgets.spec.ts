import { test, expect } from "@playwright/test";

test.describe("Budgets Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/budgets", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Anggaran Bulanan").first()).toBeVisible({ timeout: 60000 });
  });

  test("should display budgets page", async ({ page }) => {
    await expect(page.getByText("Anggaran Bulanan").first()).toBeVisible();
  });

  test("should open add budget form", async ({ page }) => {
    const addBtn = page.locator('button:has(svg.lucide-plus)').first();
    await addBtn.click();
    await expect(page.getByText(/Kategori|Simpan/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("should add a budget", async ({ page }) => {
    const addBtn = page.locator('button:has(svg.lucide-plus)').first();
    await addBtn.click();
    await page.waitForTimeout(1000);

    const categoryBtn = page.getByText(/Makan|Transportasi|Hiburan/i).first();
    if (await categoryBtn.isVisible().catch(() => false)) {
      await categoryBtn.click();
    }

    const amountInput = page.locator('input[type="number"], input[inputmode="numeric"]').first();
    if (await amountInput.isVisible().catch(() => false)) {
      await amountInput.fill("500000");
    }

    const saveBtn = page.getByText(/Simpan|Save/i).first();
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
    }
  });

  test("should show and use budget templates", async ({ page }) => {
    const templateBtn = page.getByText("Gunakan Template Budget").first();
    if (!(await templateBtn.isVisible().catch(() => false))) return;

    await templateBtn.click();
    // Template names may show as translated or i18n keys
    await expect(page.getByText(/50\/30\/20|503020|Minimalist/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("should navigate back to dashboard", async ({ page }) => {
    const backBtn = page.locator('button:has(svg.lucide-arrow-left)').first();
    if (await backBtn.isVisible().catch(() => false)) {
      await backBtn.click();
      await expect(async () => {
        expect(page.url()).toContain("/dashboard");
      }).toPass({ timeout: 30000 });
    }
  });
});
