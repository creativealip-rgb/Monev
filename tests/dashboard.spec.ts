import { test, expect } from "@playwright/test";

test.describe("Dashboard Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Hello|Halo/i)).toBeVisible({ timeout: 60000 });
  });

  test("should display dashboard elements", async ({ page }) => {
    await expect(page.getByText(/Hello|Halo/i)).toBeVisible();
    await expect(page.getByText("Tabungan")).toBeVisible();
    await expect(page.getByText("TRANSAKSI TERBARU")).toBeVisible();
  });

  test("should show daily summary section", async ({ page }) => {
    // Scroll down to see daily summary
    await page.evaluate(() => window.scrollBy(0, 500));
    await expect(page.getByText("RINGKASAN HARI INI")).toBeVisible({ timeout: 10000 });
  });

  test("should navigate via bottom nav to Riwayat", async ({ page }) => {
    await page.getByText("Riwayat").click();
    await expect(async () => {
      expect(page.url()).toContain("/transactions");
    }).toPass({ timeout: 30000 });
  });

  test("should navigate via bottom nav to Saldo", async ({ page }) => {
    await page.getByText("Saldo").last().click();
    await expect(async () => {
      expect(page.url()).toContain("/saldo");
    }).toPass({ timeout: 30000 });
  });

  test("should open add transaction sheet via center button", async ({ page }) => {
    const centerBtn = page.locator('button:has(svg.lucide-plus)').last();
    await centerBtn.click();
    await expect(page.getByText("Tambah Transaksi")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Manual Entry")).toBeVisible();
  });

  test("should navigate to feature pages", async ({ page }) => {
    await page.getByText("Tabungan").click();
    await expect(async () => {
      expect(page.url()).toContain("/savings");
    }).toPass({ timeout: 30000 });
  });

  test("should view all transactions link", async ({ page }) => {
    const viewAll = page.getByText("Lihat Semua");
    if (await viewAll.isVisible().catch(() => false)) {
      await viewAll.click();
      await expect(async () => {
        expect(page.url()).toContain("/transactions");
      }).toPass({ timeout: 30000 });
    }
  });
});
