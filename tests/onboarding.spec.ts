import { expect, test } from "@playwright/test";

const password = "QaTest12345!";


test("protected APIs return JSON unauthorized with security headers", async ({ request }) => {
    const response = await request.get("/api/stats");
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Unauthorized");
    expect(response.headers()["x-frame-options"]).toBe("DENY");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
});

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

    await page.getByRole("button", { name: /notifikasi/i }).click();
    await expect(page.getByRole("dialog", { name: "Notifikasi" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Notifikasi" })).toBeHidden();

    await page.getByRole("button", { name: /tambah transaksi|tambah/i }).click();
    await expect(page.getByRole("dialog", { name: "Tambah Transaksi" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Tambah Transaksi" })).toBeHidden();

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
    expect(stats.accountCount).toBe(1);

    const rerunResponse = await page.evaluate(async () => {
        const response = await fetch("/api/onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                currency: "IDR",
                language: "id",
                pin: "",
                notifications: true,
                initialBalance: 0,
                monthlyIncome: 4000000,
                accounts: [{ name: "BCA Test", type: "bank", balance: 1250000 }],
                budgetRecommendations: [],
            }),
        });
        return response.json();
    });
    expect(rerunResponse.success).toBeTruthy();

    const rerunStats = await page.waitForFunction(async () => {
        const now = new Date();
        const response = await fetch(`/api/stats?year=${now.getFullYear()}&month=${now.getMonth() + 1}`);
        const json = await response.json();
        if (!json.success) return null;

        return json.data.totalAccounts === 1250000 && json.data.accountCount === 1
            ? json.data
            : null;
    }, null, { timeout: 30000 });

    const statsAfterRerun = await rerunStats.jsonValue() as { totalAccounts: number; accountCount: number };
    expect(statsAfterRerun.totalAccounts).toBe(1250000);
    expect(statsAfterRerun.accountCount).toBe(1);

    await expect(page.getByText("Transaksi sekali tap")).toBeVisible({ timeout: 30000 });

    const beforeQuickAdd = await page.evaluate(async () => {
        const now = new Date();
        const response = await fetch(`/api/stats?year=${now.getFullYear()}&month=${now.getMonth() + 1}`);
        return response.json();
    });
    const beforeExpense = beforeQuickAdd.data.expense || 0;

    const invalidTransactionResponse = await page.evaluate(async () => {
        const response = await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: -1, type: "expense", accountId: 0 }),
        });
        const json = await response.json();
        return { ...json, status: response.status };
    });
    expect(invalidTransactionResponse.status).toBe(400);

    const invalidBudgetResponse = await page.evaluate(async () => {
        const response = await fetch("/api/budgets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ categoryId: 0, amount: -1, month: 13, year: 1999 }),
        });
        const json = await response.json();
        return { ...json, status: response.status };
    });
    expect(invalidBudgetResponse.status).toBe(400);

    const invalidAiResponse = await page.evaluate(async () => {
        const [simulateResponse, categorizeResponse] = await Promise.all([
            fetch("/api/ai/simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scenario: "x", amount: -1, type: "bad" }),
            }),
            fetch("/api/ai/categorize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ merchantName: "", description: "" }),
            }),
        ]);
        return { simulateStatus: simulateResponse.status, categorizeStatus: categorizeResponse.status };
    });
    expect(invalidAiResponse.simulateStatus).toBe(400);
    expect(invalidAiResponse.categorizeStatus).toBe(400);

    const invalidExportResponse = await page.evaluate(async () => {
        const [importResponse, cloudResponse] = await Promise.all([
            fetch("/api/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: "not-json",
            }),
            fetch("/api/export", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "wipe" }),
            }),
        ]);
        return { importStatus: importResponse.status, cloudStatus: cloudResponse.status };
    });
    expect(invalidExportResponse.importStatus).toBe(400);
    expect(invalidExportResponse.cloudStatus).toBe(400);

    const invalidAccountCategoryResponse = await page.evaluate(async () => {
        const [accountCreate, accountUpdate, categoryCreate, categoryDelete] = await Promise.all([
            fetch("/api/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "", type: "invalid", balance: -1 }),
            }),
            fetch("/api/accounts/not-a-number", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ balance: -1 }),
            }),
            fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "", icon: "", color: "red", type: "other" }),
            }),
            fetch("/api/categories?id=not-a-number", { method: "DELETE" }),
        ]);
        return {
            accountCreateStatus: accountCreate.status,
            accountUpdateStatus: accountUpdate.status,
            categoryCreateStatus: categoryCreate.status,
            categoryDeleteStatus: categoryDelete.status,
        };
    });
    expect(invalidAccountCategoryResponse.accountCreateStatus).toBe(400);
    expect(invalidAccountCategoryResponse.accountUpdateStatus).toBe(400);
    expect(invalidAccountCategoryResponse.categoryCreateStatus).toBe(400);
    expect(invalidAccountCategoryResponse.categoryDeleteStatus).toBe(400);

    const invalidDetailWriteResponse = await page.evaluate(async () => {
        const [transactionResponse, budgetResponse] = await Promise.all([
            fetch("/api/transactions/not-a-number", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: -1 }),
            }),
            fetch("/api/budgets/not-a-number", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: -1 }),
            }),
        ]);
        return { transactionStatus: transactionResponse.status, budgetStatus: budgetResponse.status };
    });
    expect(invalidDetailWriteResponse.transactionStatus).toBe(400);
    expect(invalidDetailWriteResponse.budgetStatus).toBe(400);

    const invalidBillWriteResponse = await page.evaluate(async () => {
        const [createResponse, updateResponse, payResponse] = await Promise.all([
            fetch("/api/bills", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "", amount: -1, dueDate: 40 }),
            }),
            fetch("/api/bills/not-a-number", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: -1 }),
            }),
            fetch("/api/bills/not-a-number/pay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accountId: 0, amount: -1 }),
            }),
        ]);
        return { createStatus: createResponse.status, updateStatus: updateResponse.status, payStatus: payResponse.status };
    });
    expect(invalidBillWriteResponse.createStatus).toBe(400);
    expect(invalidBillWriteResponse.updateStatus).toBe(400);
    expect(invalidBillWriteResponse.payStatus).toBe(400);

    const invalidQuickAddResponse = await page.evaluate(async () => {
        const response = await fetch("/api/quick-add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ label: "", amount: -1, type: "other" }),
        });
        const json = await response.json();
        return { ...json, status: response.status };
    });
    expect(invalidQuickAddResponse.status).toBe(400);

    const invalidNotificationResponse = await page.evaluate(async () => {
        const response = await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "deleteAll" }),
        });
        const json = await response.json();
        return { ...json, status: response.status };
    });
    expect(invalidNotificationResponse.status).toBe(400);

    const createShortcutResponse = await page.evaluate(async () => {
        const [accountsResponse, categoriesResponse] = await Promise.all([
            fetch("/api/accounts"),
            fetch("/api/categories"),
        ]);
        const [accountsJson, categoriesJson] = await Promise.all([
            accountsResponse.json(),
            categoriesResponse.json(),
        ]);
        const account = accountsJson.data.find((item: { name: string }) => item.name === "BCA Test");
        const category = categoriesJson.data.find((item: { name: string; type: string }) => item.name === "Makan & Minuman" && item.type === "expense");
        const response = await fetch("/api/quick-add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                label: "Parkir Test",
                amount: 33000,
                type: "expense",
                accountId: account?.id,
                categoryId: category?.id,
                merchantName: "Parkir Test",
            }),
        });
        const json = await response.json();
        return { ...json, status: response.status, account, category };
    });
    expect(createShortcutResponse.success, JSON.stringify(createShortcutResponse)).toBeTruthy();
    await page.reload({ waitUntil: "networkidle" });

    await expect(page.getByText("Parkir Test")).toBeVisible({ timeout: 10000 });
    const runShortcutResponse = await page.evaluate(async (shortcutId) => {
        const response = await fetch(`/api/quick-add/${shortcutId}/run`, { method: "POST" });
        const json = await response.json();
        return { ...json, status: response.status };
    }, createShortcutResponse.data.id);
    expect(runShortcutResponse.success, JSON.stringify(runShortcutResponse)).toBeTruthy();

    const afterQuickAdd = await page.waitForFunction(async (expenseBefore) => {
        const now = new Date();
        const response = await fetch(`/api/stats?year=${now.getFullYear()}&month=${now.getMonth() + 1}`);
        const json = await response.json();
        if (!json.success) return null;
        return json.data.expense >= expenseBefore + 33000 ? json.data : null;
    }, beforeExpense, { timeout: 30000 });

    const statsAfterQuickAdd = await afterQuickAdd.jsonValue() as { expense: number };
    expect(statsAfterQuickAdd.expense).toBeGreaterThanOrEqual(beforeExpense + 33000);

    const beforeSync = statsAfterQuickAdd.expense;
    const invalidSyncResponse = await page.evaluate(async () => {
        const syncResponse = await fetch("/api/sync/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                mutations: [{
                    clientMutationId: "short",
                    entityType: "profile",
                    operation: "replace",
                    payload: "not-object",
                }],
            }),
        });
        const conflictResponse = await fetch("/api/sync/resolve-conflict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conflictId: 0, resolution: "invalid" }),
        });
        return { syncStatus: syncResponse.status, conflictStatus: conflictResponse.status };
    });
    expect(invalidSyncResponse.syncStatus).toBe(400);
    expect(invalidSyncResponse.conflictStatus).toBe(400);

    const syncTransactionResponse = await page.evaluate(async ({ accountId, categoryId }) => {
        const response = await fetch("/api/sync/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                mutations: [{
                    clientMutationId: `offline-tx-${Date.now()}`,
                    entityType: "transaction",
                    operation: "create",
                    payload: {
                        amount: 41000,
                        description: "Offline Sync Test",
                        merchantName: "Offline Sync Test",
                        categoryId,
                        accountId,
                        type: "expense",
                        paymentMethod: "cash",
                        date: new Date().toISOString(),
                    },
                }],
            }),
        });
        const json = await response.json();
        return { ...json, status: response.status };
    }, { accountId: createShortcutResponse.account.id, categoryId: createShortcutResponse.category.id });
    expect(syncTransactionResponse.success, JSON.stringify(syncTransactionResponse)).toBeTruthy();
    expect(syncTransactionResponse.data.processed).toBeGreaterThanOrEqual(1);

    const afterSync = await page.waitForFunction(async (expenseBefore) => {
        const now = new Date();
        const response = await fetch(`/api/stats?year=${now.getFullYear()}&month=${now.getMonth() + 1}`);
        const json = await response.json();
        if (!json.success) return null;
        return json.data.expense >= expenseBefore + 41000 ? json.data : null;
    }, beforeSync, { timeout: 30000 });
    const statsAfterSync = await afterSync.jsonValue() as { expense: number };
    expect(statsAfterSync.expense).toBeGreaterThanOrEqual(beforeSync + 41000);

    const syncStatusResponse = await page.evaluate(async () => {
        const response = await fetch("/api/sync/status");
        const json = await response.json();
        return { ...json, status: response.status };
    });
    expect(syncStatusResponse.success, JSON.stringify(syncStatusResponse)).toBeTruthy();
    expect(syncStatusResponse.data.synced).toBeGreaterThanOrEqual(1);

    const achievementProgressResponse = await page.evaluate(async () => {
        const response = await fetch("/api/achievements/progress");
        const json = await response.json();
        return { ...json, status: response.status };
    });
    expect(achievementProgressResponse.success, JSON.stringify(achievementProgressResponse)).toBeTruthy();
    const firstTransactionAchievement = achievementProgressResponse.data.find((item: { code: string }) => item.code === "first_tx");
    expect(firstTransactionAchievement?.unlocked).toBeTruthy();
    expect(firstTransactionAchievement?.percent).toBe(100);

    const streakResponse = await page.evaluate(async () => {
        const response = await fetch("/api/streaks");
        const json = await response.json();
        return { ...json, status: response.status };
    });
    expect(streakResponse.success, JSON.stringify(streakResponse)).toBeTruthy();
    expect(streakResponse.data.currentStreak).toBeGreaterThanOrEqual(1);

    const invalidSplitBillResponse = await page.evaluate(async () => {
        const response = await fetch("/api/split-bills", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "", items: [], participants: [] }),
        });
        const json = await response.json();
        return { ...json, status: response.status };
    });
    expect(invalidSplitBillResponse.status).toBe(400);

    const splitBillResponse = await page.evaluate(async () => {
        const response = await fetch("/api/split-bills", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: "Dinner Split E2E",
                paymentInstructions: "Transfer ke rekening test",
                items: [
                    { name: "Nasi Goreng", price: 50000, quantity: 1 },
                    { name: "Es Teh", price: 10000, quantity: 2 },
                ],
                participants: [
                    { name: "Andi" },
                    { name: "Budi" },
                ],
            }),
        });
        const json = await response.json();
        return { ...json, status: response.status };
    });
    expect(splitBillResponse.success, JSON.stringify(splitBillResponse)).toBeTruthy();
    expect(splitBillResponse.data.totalAmount).toBe(70000);
    expect(splitBillResponse.data.participants).toHaveLength(2);
    expect(splitBillResponse.data.participants[0].amountOwed).toBe(35000);

    const publicSplitBillResponse = await page.evaluate(async ({ publicId, paymentToken }) => {
        const publicResponse = await fetch(`/api/public/split-bills/${publicId}`);
        const publicJson = await publicResponse.json();
        const invalidPayResponse = await fetch(`/api/public/split-bills/${publicId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentToken: "bad-token" }),
        });
        const payResponse = await fetch(`/api/public/split-bills/${publicId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentToken }),
        });
        const payJson = await payResponse.json();
        return {
            publicSuccess: publicJson.success,
            publicTotal: publicJson.data?.totalAmount,
            publicTokenExposed: Boolean(publicJson.data?.participants?.[0]?.paymentToken),
            invalidStatus: invalidPayResponse.status,
            paySuccess: payJson.success,
            statusAfterPay: payJson.data?.status,
            payTokenExposed: Boolean(payJson.data?.participants?.[0]?.paymentToken),
        };
    }, {
        publicId: splitBillResponse.data.publicId,
        paymentToken: splitBillResponse.data.participants[0].paymentToken,
    });
    expect(publicSplitBillResponse.publicSuccess, JSON.stringify(publicSplitBillResponse)).toBeTruthy();
    expect(publicSplitBillResponse.publicTotal).toBe(70000);
    expect(publicSplitBillResponse.publicTokenExposed).toBe(false);
    expect(publicSplitBillResponse.invalidStatus).toBe(400);
    expect(publicSplitBillResponse.paySuccess, JSON.stringify(publicSplitBillResponse)).toBeTruthy();
    expect(publicSplitBillResponse.statusAfterPay).toBe("partial");
    expect(publicSplitBillResponse.payTokenExposed).toBe(false);

    await page.goto(`/split-bills/${splitBillResponse.data.publicId}?token=${splitBillResponse.data.participants[1].paymentToken}`, { waitUntil: "networkidle" });
    await expect(page.getByText("Monev Split Bill")).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Dinner Split E2E")).toBeVisible();
    await expect(page.getByText("Rp 35.000").first()).toBeVisible();

    await page.goto("/debts", { waitUntil: "networkidle" });
    await expect(page.getByTestId("split-bill-v2-list")).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Dinner Split E2E").first()).toBeVisible();
    await page.goto("/analytics?tab=heatmap", { waitUntil: "networkidle" });
    await expect(page.getByTestId("spending-heatmap")).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Pola pengeluaran harian")).toBeVisible();
    await page.goto("/analytics?tab=forecast", { waitUntil: "networkidle" });
    await expect(page.getByTestId("cashflow-forecast")).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Prediksi 3 bulan ke depan")).toBeVisible();
    await page.goto("/analytics?tab=category-trend", { waitUntil: "networkidle" });
    await expect(page.getByTestId("category-trend-chart")).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Tren kategori 6 bulan")).toBeVisible();
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const recurringSuggestionsResponse = await page.evaluate(async () => {
        const response = await fetch("/api/recurring/suggestions");
        const json = await response.json();
        return { ...json, status: response.status };
    });
    expect(recurringSuggestionsResponse.success, JSON.stringify(recurringSuggestionsResponse)).toBeTruthy();
    expect(Array.isArray(recurringSuggestionsResponse.data)).toBeTruthy();

    await page.goto("/chat", { waitUntil: "networkidle" });
    await page.getByTestId("chat-input").fill("makan 20rb");
    await page.getByTestId("chat-send").click();
    await expect(page.getByText("Pengeluaran tercatat")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("span", { hasText: "Rp 20.000" }).first()).toBeVisible({ timeout: 10000 });
    await page.getByTestId("chat-undo-transaction").last().click();
    await expect(page.getByText("Transaksi berhasil di-undo")).toBeVisible({ timeout: 30000 });
});
