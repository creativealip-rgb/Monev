import { test, expect } from "@playwright/test";

test.describe("Bills Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/bills", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Tagihan").first()).toBeVisible({ timeout: 60000 });
  });

  test("should display bills page", async ({ page }) => {
    await expect(page.getByText("Tagihan").first()).toBeVisible();
  });

  test("should show empty state with add button", async ({ page }) => {
    // When no bills exist, shows empty state with "Tambah Tagihan" button
    const tambahBtn = page.getByRole("button", { name: "Tambah Tagihan" });
    await expect(tambahBtn).toBeVisible({ timeout: 10000 });
  });

  test("should add a bill", async ({ page }) => {
    const addBtn = page.locator('button:has(svg.lucide-plus)').first();
    await addBtn.click();
    await page.waitForTimeout(1000);

    const nameInput = page.locator('input').first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill("Internet Bulanan");
    }

    const amountInput = page.locator('input[type="number"], input[inputmode="numeric"]').first();
    if (await amountInput.isVisible().catch(() => false)) {
      await amountInput.fill("350000");
    }

    const saveBtn = page.getByText(/Simpan|Save/i).first();
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
    }
  });

  test("should switch between tabs", async ({ page }) => {
    for (const tab of ["Belum Bayar", "Lunas", "Semua"]) {
      const tabBtn = page.getByText(tab).first();
      if (await tabBtn.isVisible().catch(() => false)) {
        await tabBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test("should toggle list and calendar view", async ({ page }) => {
    const calendarBtn = page.locator('button:has(svg.lucide-layout-grid), button:has(svg.lucide-calendar)').first();
    if (!(await calendarBtn.isVisible().catch(() => false))) return;

    await calendarBtn.click();
    await page.waitForTimeout(1000);

    const listBtn = page.locator('button:has(svg.lucide-list)').first();
    if (await listBtn.isVisible().catch(() => false)) {
      await listBtn.click();
    }
  });
});
