import { expect, test } from "@playwright/test";

async function registerAndLogin(page: any, request: any) {
  const password = "QaTest12345!";
  const email = `chat_e2e_${Date.now()}_${Math.random().toString(36).slice(2)}@monev.test`;

  const registerResp = await request.post("/api/auth/register", {
    data: {
      name: "Chat E2E User",
      email,
      password,
      confirmPassword: password,
    },
  });
  const registerJson = await registerResp.json();
  expect(registerJson.success).toBeTruthy();

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Selamat Datang Kembali")).toBeVisible({ timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.getByPlaceholder("you@example.com").click();
  await page.keyboard.type(email);
  await page.getByPlaceholder("Masukkan kata sandi").click();
  await page.keyboard.type(password);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).not.toHaveURL(/\/login$/, { timeout: 60000 });

  await page.evaluate(async () => {
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initialBalance: 0, notifications: false }),
    });
    localStorage.setItem("monev_onboarding_complete", "true");
  });
}

async function openChat(page: any) {
  for (let attempt = 0; attempt < 8; attempt++) {
    await page.goto("/chat", { waitUntil: "domcontentloaded" });

    const skipButton = page.getByText("Lewati").first();
    const startButton = page.getByText("Mulai Sekarang").first();
    const nextButton = page.getByRole("button", { name: /Lanjut|Selesai/i }).first();

    if (await skipButton.isVisible({ timeout: 1500 }).catch(() => false)) {
      await skipButton.click({ force: true });
      await page.waitForTimeout(1000);
      continue;
    }
    if (await startButton.isVisible({ timeout: 1500 }).catch(() => false)) {
      await startButton.click({ force: true });
      await page.waitForTimeout(1000);
      continue;
    }
    if (await nextButton.isVisible({ timeout: 1500 }).catch(() => false)) {
      await nextButton.click({ force: true });
      await page.waitForTimeout(1000);
      continue;
    }

    const chatInput = page.getByTestId("chat-input");
    if (await chatInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      return chatInput;
    }
    await page.waitForTimeout(1500);
  }

  const chatInput = page.getByTestId("chat-input");
  await expect(chatInput).toBeVisible({ timeout: 30000 });
  return chatInput;
}

async function sendChatMessage(page: any, message: string) {
  let chatInput = page.getByTestId("chat-input");
  if (!(await chatInput.isVisible({ timeout: 5000 }).catch(() => false))) {
    chatInput = await openChat(page);
  }
  await expect(chatInput).toBeVisible({ timeout: 30000 });
  await chatInput.fill(message, { force: true });
  await expect(page.getByTestId("chat-send")).toBeEnabled({ timeout: 30000 });
  await page.getByTestId("chat-send").click({ force: true });
}

test.describe("Chat AI", () => {
  test("records a transaction, shows undo button, and removes it from history", async ({ page, request }) => {
    await registerAndLogin(page, request);
    await openChat(page);

    await sendChatMessage(page, "makan siang 25rb");

    await expect(page.getByText("Sudah saya catat")).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Rp 25.000")).toBeVisible();
    await expect(page.getByTestId("chat-undo-transaction")).toBeVisible();

    await page.getByTestId("chat-undo-transaction").click();
    await expect(page.getByRole("button", { name: "Sudah di-undo" })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("transaksi terakhir sudah saya undo")).toBeVisible();

    await page.goto("/transactions", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("0 Transaksi")).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Belum ada transaksi")).toBeVisible();
  });

  test("creates a goal from a budget plan and updates progress from chat", async ({ page, request }) => {
    await registerAndLogin(page, request);
    await openChat(page);

    await sendChatMessage(page, "bantu gw buat budget untuk beli mac air m4");
    await expect(page.getByText(/harga/i)).toBeVisible({ timeout: 30000 });

    await sendChatMessage(page, "harga 18jt, 6 bulan, sanggup 3jt per bulan");
    await expect(page.getByText("Target: Rp 18.000.000")).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Deadline: 6 bulan")).toBeVisible();

    await sendChatMessage(page, "iya jadiin goal");
    await expect(page.getByText(/goal tabungan sudah saya buat/i)).toBeVisible({ timeout: 30000 });

    await page.goto("/savings", { waitUntil: "domcontentloaded" });
    const goalCard = page.getByTestId("savings-goal-card").filter({ hasText: "Mac Air M4" });
    await expect(goalCard).toBeVisible({ timeout: 30000 });
    await expect(goalCard.getByTestId("savings-goal-target")).toContainText("Rp 18.000.000");

    await openChat(page);
    await sendChatMessage(page, "tambah tabungan mac 500rb");
    await expect(page.getByText(/progress goal Mac Air M4/i)).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Ditambahkan: Rp 500.000")).toBeVisible();
    await expect(page.getByText("Terkumpul: Rp 500.000 / Rp 18.000.000")).toBeVisible();

    await page.goto("/savings", { waitUntil: "domcontentloaded" });
    const updatedGoalCard = page.getByTestId("savings-goal-card").filter({ hasText: "Mac Air M4" });
    await expect(updatedGoalCard).toBeVisible({ timeout: 30000 });
    await expect(updatedGoalCard.getByTestId("savings-goal-current")).toContainText("Rp 500.000");
    await expect(updatedGoalCard.getByTestId("savings-goal-progress")).toContainText("3%");
  });
});
