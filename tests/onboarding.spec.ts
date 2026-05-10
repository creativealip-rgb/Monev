import { expect, test } from "@playwright/test";

const password = "QaTest12345!";

test("login then complete quick onboarding with monthly income budget", async ({ page, request }) => {
    const email = `onboarding_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;

    const registerResp = await request.post("/api/auth/register", {
        data: {
            name: "Onboarding E2E User",
            email,
            password,
            confirmPassword: password,
        },
    });
    const registerJson = await registerResp.json();
    expect(registerJson.success).toBeTruthy();

    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Selamat Datang Kembali")).toBeVisible({ timeout: 30000 });
    await page.waitForFunction(() => document.activeElement?.id === "email", { timeout: 15000 }).catch(() => {});
    await page.waitForLoadState("networkidle").catch(() => {});

    await page.getByLabel("Alamat Email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Masuk" }).click();

    await expect(page).toHaveURL(/\/onboarding/, { timeout: 60000 });
    await expect(page.getByText("Kelola Keuanganmu dengan Cerdas")).toBeVisible({ timeout: 30000 });

    await page.getByRole("button", { name: /Mulai|Mulai Sekarang/i }).click();
    await expect(page.getByRole("heading", { name: "Catat Transaksi dalam Sekejap" })).toBeVisible({ timeout: 30000 });

    await page.getByRole("button", { name: "Lanjut" }).click();
    await expect(page.getByText("Pilih Jalur Setup")).toBeVisible({ timeout: 30000 });

    await page.getByText("Quick Start").click();
    await expect(page.getByRole("heading", { name: "Pilih Data Demo" })).toBeVisible({ timeout: 30000 });

    await page.getByText(/Tanpa Data|Mulai Kosong|Lewati/i).first().click();
    await expect(page.getByText("Penghasilan Bulanan")).toBeVisible({ timeout: 30000 });

    await page.getByPlaceholder("0").fill("5000000");
    await page.getByRole("button", { name: "Lanjut ke Budget AI" }).click();

    await expect(page.getByText("Saran Budget AI")).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Berdasarkan penghasilan Rp 5.000.000/bulan")).toBeVisible();

    await page.getByRole("button", { name: "Terapkan Budget" }).click();
    await expect(page.getByText("First Step")).toBeVisible({ timeout: 30000 });

    await page.getByRole("button", { name: /Lanjut|Dashboard|Mulai/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 60000 });

    const persistedStats = await page.waitForFunction(async () => {
        const now = new Date();
        const response = await fetch(`/api/stats?year=${now.getFullYear()}&month=${now.getMonth() + 1}`);
        const json = await response.json();
        if (!json.success) return null;

        return json.data.monthlyIncome === 5000000 && json.data.weeklyBudgetTotal === 5000000
            ? json.data
            : null;
    }, null, { timeout: 30000 });

    const stats = await persistedStats.jsonValue() as { monthlyIncome: number; weeklyBudgetTotal: number };
    expect(stats.monthlyIncome).toBe(5000000);
    expect(stats.weeklyBudgetTotal).toBe(5000000);
});

test("login then complete account onboarding persists opening balance to accounts", async ({ page, request }) => {
    const email = `onboarding_complete_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;

    const registerResp = await request.post("/api/auth/register", {
        data: {
            name: "Onboarding Complete E2E User",
            email,
            password,
            confirmPassword: password,
        },
    });
    const registerJson = await registerResp.json();
    expect(registerJson.success).toBeTruthy();

    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Selamat Datang Kembali")).toBeVisible({ timeout: 30000 });
    await page.waitForFunction(() => document.activeElement?.id === "email", { timeout: 15000 }).catch(() => {});
    await page.waitForLoadState("networkidle").catch(() => {});

    await page.getByLabel("Alamat Email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Masuk" }).click();

    await expect(page).toHaveURL(/\/onboarding/, { timeout: 60000 });
    await expect(page.getByText("Kelola Keuanganmu dengan Cerdas")).toBeVisible({ timeout: 30000 });

    await page.getByRole("button", { name: /Mulai|Mulai Sekarang/i }).click();
    await expect(page.getByRole("heading", { name: "Catat Transaksi dalam Sekejap" })).toBeVisible({ timeout: 30000 });

    await page.getByRole("button", { name: "Lanjut" }).click();
    await expect(page.getByText("Pilih Jalur Setup")).toBeVisible({ timeout: 30000 });

    await page.getByText("Complete Setup").click();
    await expect(page.getByRole("heading", { name: "Setup Akun Keuangan" })).toBeVisible({ timeout: 30000 });

    await page.getByRole("button", { name: "Tambah Akun" }).click();
    await page.getByPlaceholder("Contoh: BCA, GoPay, Cash").fill("BCA Test");
    await page.getByRole("spinbutton").fill("1250000");
    await page.getByRole("button", { name: "Tambah" }).click();
    await expect(page.getByText("BCA Test")).toBeVisible();
    await expect(page.getByText("Rp 1.250.000")).toBeVisible();

    await page.getByRole("button", { name: /Lanjut \(1\)/ }).click();
    await expect(page.getByText("Penghasilan Bulanan")).toBeVisible({ timeout: 30000 });

    await page.getByPlaceholder("0").fill("4000000");
    await page.getByRole("button", { name: "Lanjut ke Budget AI" }).click();

    await expect(page.getByText("Saran Budget AI")).toBeVisible({ timeout: 30000 });
    await page.getByRole("button", { name: "Terapkan Budget" }).click();
    await expect(page.getByText("First Step")).toBeVisible({ timeout: 30000 });

    await page.getByRole("button", { name: /Lanjut|Dashboard|Mulai/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 60000 });

    const persistedStats = await page.waitForFunction(async () => {
        const now = new Date();
        const response = await fetch(`/api/stats?year=${now.getFullYear()}&month=${now.getMonth() + 1}`);
        const json = await response.json();
        if (!json.success) return null;

        return json.data.totalAccounts === 1250000 && json.data.accountCount >= 1
            ? json.data
            : null;
    }, null, { timeout: 30000 });

    const stats = await persistedStats.jsonValue() as { totalAccounts: number; accountCount: number };
    expect(stats.totalAccounts).toBe(1250000);
    expect(stats.accountCount).toBeGreaterThanOrEqual(1);
});
